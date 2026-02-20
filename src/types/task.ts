export type Category = "ACADEMIC" | "CAREER" | "PERSONAL"
export type TaskStatus = "ACTIVE" | "PAUSED" | "COMPLETED"

export interface Task {
  id: string
  title: string
  description: string | null
  category: Category
  status: TaskStatus
  aiGuidance: string | null
  targetDate: string | null
  reminderAt: string | null
  lastInteractedAt: string | null
  createdAt: string
  updatedAt: string
  userId: string
  subtasks: Subtask[]
}

export interface Subtask {
  id: string
  title: string
  description: string | null
  estimatedMinutes: number | null
  completed: boolean
  completedAt: string | null
  orderIndex: number
  taskId: string
}

export interface CreateTaskInput {
  title: string
  description?: string
  category: Category
  targetDate?: string
  reminderAt?: string
}

export interface UpdateTaskInput {
  title?: string
  description?: string
  category?: Category
  status?: TaskStatus
  targetDate?: string
  reminderAt?: string | null
}

export interface UpdateSubtaskInput {
  completed?: boolean
  title?: string
  description?: string
}
