import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import {
  TASK_BREAKDOWN_PROMPT,
  TASK_BREAKDOWN_PROMPT_V1,
  PROMPT_VERSION,
} from "@/lib/prompts"

// Development-only endpoint — test Claude tone without creating real tasks.
// In production this should be behind auth; for now a simple env-check suffices.
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 })
  }

  const { taskDescription, promptVersion = "current" } = await request.json()

  if (!taskDescription?.trim()) {
    return NextResponse.json({ error: "taskDescription is required" }, { status: 400 })
  }

  const systemPrompt =
    promptVersion === "v1" ? TASK_BREAKDOWN_PROMPT_V1 : TASK_BREAKDOWN_PROMPT

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const userMessage = `Task Title: ${taskDescription.trim()}\n\nPlease break this task down into manageable steps and provide supportive guidance.`

  const start = Date.now()

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  })

  const elapsed = Date.now() - start

  const textContent = response.content.find((b) => b.type === "text")
  const rawText = textContent?.type === "text" ? textContent.text : ""

  let parsed: unknown = null
  let parseError: string | null = null
  try {
    parsed = JSON.parse(rawText)
  } catch (e: unknown) {
    parseError = e instanceof Error ? e.message : "Unknown parse error"
  }

  return NextResponse.json({
    promptVersion: promptVersion === "v1" ? "1.0" : PROMPT_VERSION,
    elapsedMs: elapsed,
    raw: rawText,
    parsed,
    parseError,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  })
}
