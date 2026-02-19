export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function formatTimeEstimate(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  if (remaining === 0) return `${hours}h`
  return `${hours}h ${remaining}m`
}

export function getNextSubtask(subtasks: { completed: boolean; orderIndex: number }[]) {
  return subtasks
    .filter((s) => !s.completed)
    .sort((a, b) => a.orderIndex - b.orderIndex)[0] || null
}

export function getProgressPercentage(subtasks: { completed: boolean }[]): number {
  if (subtasks.length === 0) return 0
  const completed = subtasks.filter((s) => s.completed).length
  return Math.round((completed / subtasks.length) * 100)
}

export function getCategoryColour(category: string): string {
  const colours: Record<string, string> = {
    ACADEMIC: "#7FAACC",
    CAREER: "#C2A0D0",
    PERSONAL: "#F0C674",
  }
  return colours[category] || "#6B8F9E"
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    ACADEMIC: "Academic",
    CAREER: "Career",
    PERSONAL: "Personal",
  }
  return labels[category] || "Personal"
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ")
}
