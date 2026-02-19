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
}

export interface UpdateTaskInput {
  title?: string
  description?: string
  category?: Category
  status?: TaskStatus
  targetDate?: string
}

export interface UpdateSubtaskInput {
  completed?: boolean
  title?: string
  description?: string
}
