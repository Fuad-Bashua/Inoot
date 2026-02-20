import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { computeUserPatterns } from "@/lib/patterns"
import {
  TASK_BREAKDOWN_PROMPT,
  buildUserContextSection,
  buildEnergyModeSection,
  buildToneSection,
  buildDetailLevelSection,
  EnergyMode,
} from "@/lib/prompts"
import { AIBreakdownResponse } from "@/types/ai"
import prisma from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// SSE helper — wraps a JS value as a Server-Sent Event data line
function sseChunk(payload: object): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`)
}

// POST /api/breakdown — streams Claude response via SSE, then saves to DB
export async function POST(request: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return new Response(
      JSON.stringify({ success: false, error: "Not authenticated" }),
      { status: 401 }
    )
  }

  const userId = (session.user as { id: string }).id

  // ── Parse body ────────────────────────────────────────────────────────────
  const { taskId, energyMode } = (await request.json()) as {
    taskId: string
    energyMode?: EnergyMode
  }

  if (!taskId) {
    return new Response(
      JSON.stringify({ success: false, error: "Task ID is required" }),
      { status: 400 }
    )
  }

  // ── Verify task belongs to user ───────────────────────────────────────────
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
  })

  if (!task) {
    return new Response(
      JSON.stringify({ success: false, error: "Task not found" }),
      { status: 404 }
    )
  }

  // ── Build personalised system prompt ──────────────────────────────────────
  const [patterns, preferences] = await Promise.all([
    computeUserPatterns(userId),
    prisma.userPreference.findUnique({ where: { userId } }),
  ])

  const systemPrompt =
    TASK_BREAKDOWN_PROMPT +
    buildUserContextSection(patterns) +
    buildEnergyModeSection(energyMode) +
    buildToneSection(preferences?.tonePreference) +
    buildDetailLevelSection(preferences?.taskDetailLevel)

  const userMessage = `
Task Title: ${task.title}
${task.description ? `Task Description: ${task.description}` : ""}
Category: ${task.category}

Please break this task down into manageable steps and provide supportive guidance.
  `.trim()

  // ── Stream from Claude, relay chunks, save at end ─────────────────────────
  const stream = new ReadableStream({
    async start(controller) {
      let fullText = ""

      try {
        const claudeStream = anthropic.messages.stream({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          system: systemPrompt,
          messages: [{ role: "user", content: userMessage }],
        })

        for await (const event of claudeStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const text = event.delta.text
            fullText += text
            controller.enqueue(sseChunk({ type: "chunk", text }))
          }
        }

        // ── Parse completed JSON ────────────────────────────────────────────
        let breakdown: AIBreakdownResponse
        try {
          breakdown = JSON.parse(fullText)
        } catch {
          controller.enqueue(
            sseChunk({
              type: "error",
              message:
                "Something interrupted the response. Let me try again.",
            })
          )
          controller.close()
          return
        }

        // ── Save subtasks + update task ─────────────────────────────────────
        await prisma.subtask.deleteMany({ where: { taskId } })

        await Promise.all(
          breakdown.subtasks.map((subtask, index) =>
            prisma.subtask.create({
              data: {
                title: subtask.title,
                description: subtask.description,
                estimatedMinutes: subtask.estimatedMinutes,
                orderIndex: index,
                taskId,
              },
            })
          )
        )

        await prisma.task.update({
          where: { id: taskId },
          data: {
            title: breakdown.taskTitle,
            aiGuidance: breakdown.guidance,
          },
        })

        // ── Signal completion ───────────────────────────────────────────────
        controller.enqueue(sseChunk({ type: "done", taskId }))
      } catch (error) {
        console.error("Breakdown streaming error:", error)
        controller.enqueue(
          sseChunk({
            type: "error",
            message:
              "Something didn't work — try again when you're ready.",
          })
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
