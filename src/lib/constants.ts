export const CATEGORIES = [
  { value: "ACADEMIC", label: "Academic", colour: "#7FAACC", icon: "📚" },
  { value: "CAREER", label: "Career", colour: "#C2A0D0", icon: "💼" },
  { value: "PERSONAL", label: "Personal", colour: "#F0C674", icon: "🌱" },
] as const

export const TASK_STATUSES = {
  ACTIVE: "Active",
  PAUSED: "Paused",
  COMPLETED: "Completed",
} as const

export const APP_NAME = "Inoot"
export const APP_DESCRIPTION = "Your calm, adaptive task assistant"
export const MAX_SUBTASKS = 7
export const MAX_TASK_TITLE_LENGTH = 200
export const MAX_TASK_DESCRIPTION_LENGTH = 2000
