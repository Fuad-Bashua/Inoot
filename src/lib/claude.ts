import Anthropic from "@anthropic-ai/sdk"
import { TASK_BREAKDOWN_PROMPT } from "./prompts"
import { AIBreakdownResponse } from "@/types/ai"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function generateTaskBreakdown(
  title: string,
  description: string = "",
  category: string = "PERSONAL"
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
    system: TASK_BREAKDOWN_PROMPT,
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
