"use client"

/**
 * /admin/tone-test — Development-only AI tone testing tool.
 *
 * Lets you submit a task description and see the raw Claude response
 * so you can iterate on prompts without going through the full task
 * creation flow. Not user-facing.
 */

import { useState } from "react"
import { PROMPT_VERSION, PROMPT_CHANGELOG } from "@/lib/prompts"

const SAMPLE_INPUTS = [
  "finish my dissertation chapter by friday",
  "clean my room",
  "prepare for job interview at google next week",
  "i need to do my taxes",
  "study for exam tomorrow",
  "start learning python",
  "apply for student finance",
  "go to the gym",
]

interface TestResult {
  promptVersion: string
  elapsedMs: number
  raw: string
  parsed: {
    taskTitle: string
    subtasks: { title: string; description: string; estimatedMinutes: number }[]
    guidance: string
    encouragement: string
  } | null
  parseError: string | null
  inputTokens: number
  outputTokens: number
}

function SubtaskList({
  subtasks,
}: {
  subtasks: TestResult["parsed"] extends null ? never : NonNullable<TestResult["parsed"]>["subtasks"]
}) {
  return (
    <ol className="space-y-3 list-none">
      {subtasks.map((s, i) => (
        <li key={i} className="p-3 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-start justify-between gap-4">
            <p className="font-medium text-gray-900 text-sm">
              {i + 1}. {s.title}
            </p>
            <span className="text-xs text-gray-400 whitespace-nowrap flex-none">
              ~{s.estimatedMinutes} min
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-1 leading-relaxed">{s.description}</p>
        </li>
      ))}
    </ol>
  )
}

export default function ToneTestPage() {
  const [input, setInput] = useState("")
  const [promptVersion, setPromptVersion] = useState<"current" | "v1">("current")
  const [result, setResult] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showRaw, setShowRaw] = useState(false)

  async function handleTest(taskDescription: string) {
    if (!taskDescription.trim()) return
    setInput(taskDescription)
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch("/api/admin/tone-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskDescription, promptVersion }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Request failed")
      setResult(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">AI Tone Test</h1>
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-medium">
              DEV ONLY
            </span>
          </div>
          <p className="text-sm text-gray-600">
            Submit a task description to test Claude&apos;s response tone without
            creating a real task. Current prompt:{" "}
            <strong>v{PROMPT_VERSION}</strong>
          </p>
        </div>

        {/* Changelog */}
        <details className="bg-white border border-gray-200 rounded-lg">
          <summary className="px-4 py-3 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50">
            Prompt changelog
          </summary>
          <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
            {PROMPT_CHANGELOG.map((entry) => (
              <div key={entry.version} className="text-sm">
                <span className="font-medium text-gray-900">
                  v{entry.version} — Sprint {entry.sprint}
                </span>
                <p className="text-gray-600 mt-0.5 leading-relaxed">{entry.changes}</p>
              </div>
            ))}
          </div>
        </details>

        {/* Prompt version selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Test against:</span>
          <div className="flex gap-2">
            {(["current", "v1"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setPromptVersion(v)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  promptVersion === v
                    ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {v === "current" ? `v${PROMPT_VERSION} (current)` : "v1.0 (Sprint 1)"}
              </button>
            ))}
          </div>
        </div>

        {/* Input form */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <label htmlFor="task-input" className="text-sm font-medium text-gray-700 block">
            Task description
          </label>
          <textarea
            id="task-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. finish my dissertation chapter by friday"
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <button
            onClick={() => handleTest(input)}
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Generating..." : "Test Claude response →"}
          </button>
        </div>

        {/* Sample inputs */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Sample inputs — click to test
          </p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_INPUTS.map((s) => (
              <button
                key={s}
                onClick={() => handleTest(s)}
                disabled={loading}
                className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg text-gray-700
                           hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-4">
            {/* Meta */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>Prompt: <strong>v{result.promptVersion}</strong></span>
              <span>Time: <strong>{result.elapsedMs}ms</strong></span>
              <span>Tokens in/out: <strong>{result.inputTokens} / {result.outputTokens}</strong></span>
              {result.parseError && (
                <span className="text-red-600 font-medium">⚠ Parse error: {result.parseError}</span>
              )}
            </div>

            {result.parsed ? (
              <div className="space-y-4">
                {/* Task title */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Task title</p>
                  <p className="font-semibold text-gray-900">{result.parsed.taskTitle}</p>
                </div>

                {/* Guidance */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">Guidance</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{result.parsed.guidance}</p>
                </div>

                {/* Subtasks */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Subtasks ({result.parsed.subtasks.length})
                  </p>
                  <SubtaskList subtasks={result.parsed.subtasks} />
                </div>

                {/* Encouragement */}
                <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                  <p className="text-xs font-medium text-green-600 uppercase tracking-wide mb-1">Encouragement</p>
                  <p className="text-sm text-gray-700 italic leading-relaxed">{result.parsed.encouragement}</p>
                </div>

                {/* Tone check — flag banned phrases */}
                <ToneCheck parsed={result.parsed} />
              </div>
            ) : null}

            {/* Raw JSON toggle */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <button
                onClick={() => setShowRaw((v) => !v)}
                className="w-full px-4 py-3 text-sm text-left font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                {showRaw ? "▼" : "▶"} Raw Claude output
              </button>
              {showRaw && (
                <pre className="px-4 pb-4 text-xs text-gray-600 overflow-auto max-h-64 whitespace-pre-wrap border-t border-gray-100 pt-3">
                  {result.raw}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Tone checker — flags banned phrases in the response ──────────────────────
const BANNED_PHRASES = [
  "you need to",
  "you should",
  "don't forget",
  "make sure you",
  "you must",
  "hurry up",
  "as soon as possible",
  "it's important that you",
  "you have to",
  "be sure to",
]

function ToneCheck({ parsed }: { parsed: NonNullable<TestResult["parsed"]> }) {
  const allText = [
    parsed.taskTitle,
    parsed.guidance,
    parsed.encouragement,
    ...parsed.subtasks.map((s) => s.title + " " + s.description),
  ]
    .join(" ")
    .toLowerCase()

  const found = BANNED_PHRASES.filter((phrase) => allText.includes(phrase))

  if (found.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-100 rounded-lg">
        <span className="text-green-600 font-medium text-sm">✓ Tone check passed</span>
        <span className="text-xs text-green-600">No banned phrases detected</span>
      </div>
    )
  }

  return (
    <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg space-y-1">
      <p className="text-sm font-medium text-red-700">⚠ Banned phrases detected:</p>
      <ul className="text-xs text-red-600 space-y-0.5">
        {found.map((phrase) => (
          <li key={phrase}>&ldquo;{phrase}&rdquo;</li>
        ))}
      </ul>
    </div>
  )
}
