export interface AIBreakdownRequest {
  title: string
  description?: string
  category: string
}

export interface AIBreakdownResponse {
  taskTitle: string
  subtasks: AISubtask[]
  guidance: string
  encouragement: string
}

export interface AISubtask {
  title: string
  description: string
  estimatedMinutes: number
}
