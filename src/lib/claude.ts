import Anthropic from "@anthropic-ai/sdk"
import { TASK_BREAKDOWN_PROMPT, CONTEXT_RECAP_PROMPT } from "./prompts"
import { AIBreakdownResponse } from "@/types/ai"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

/**
 * Calls Claude to break a task into subtasks.
 *
 * @param title           - The task title as entered by the user.
 * @param description     - Optional additional context.
 * @param category        - "ACADEMIC" | "CAREER" | "PERSONAL"
 * @param systemPrompt    - Optional override for the full system prompt. When
 *                          provided (e.g. with a user-context section appended),
 *                          this replaces the default TASK_BREAKDOWN_PROMPT.
 *                          Also used by the /admin/tone-test route for v1 comparisons.
 */
export async function generateTaskBreakdown(
  title: string,
  description: string = "",
  category: string = "PERSONAL",
  systemPrompt?: string
): Promise<AIBreakdownResponse> {
  const userMessage = `
Task Title: ${title}
${description ? `Task Description: ${description}` : ""}
Category: ${category}

Please break this task down into manageable steps and provide supportive guidance.
  `.trim()

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    system: systemPrompt ?? TASK_BREAKDOWN_PROMPT,
    messages: [
      {
        role: "user",
        content: userMessage,
      },
    ],
  })

  const textContent = response.content.find((block) => block.type === "text")
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from Claude")
  }

  try {
    const parsed: AIBreakdownResponse = JSON.parse(textContent.text)
    return parsed
  } catch {
    throw new Error("Failed to parse Claude response as JSON")
  }
}

/**
 * Generates a brief 2–3 sentence context recap for a user returning to a task
 * after time away. Uses CONTEXT_RECAP_PROMPT — returns plain text, not JSON.
 */
export async function generateContextRecap(
  taskTitle: string,
  completedSubtasks: { title: string }[],
  remainingSubtasks: { title: string }[],
  hoursSince: number
): Promise<string> {
  const days = Math.floor(hoursSince / 24)
  const timeDescription =
    days >= 7
      ? `${days} days`
      : days >= 2
      ? `${days} days`
      : days === 1
      ? "about a day"
      : `${Math.round(hoursSince)} hours`

  const userMessage = `
Task: "${taskTitle}"
Time since last visit: about ${timeDescription} ago
Completed steps: ${
    completedSubtasks.length === 0
      ? "none yet"
      : completedSubtasks.map((s) => `"${s.title}"`).join(", ")
  }
Remaining steps: ${
    remainingSubtasks.length === 0
      ? "all done!"
      : remainingSubtasks.map((s) => `"${s.title}"`).join(", ")
  }
  `.trim()

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 200,
    system: CONTEXT_RECAP_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  })

  const textContent = response.content.find((b) => b.type === "text")
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from Claude")
  }
  return textContent.text.trim()
}
