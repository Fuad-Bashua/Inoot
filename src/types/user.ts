export interface User {
  id: string
  name: string
  email: string
  createdAt: string
}

export interface UserPreference {
  id: string
  userId: string
  tonePreference: "SUPPORTIVE" | "STRUCTURED" | "CASUAL"
  reminderFrequency: string
  workloadLevel: string
  showEncouragement: boolean
}

export interface SignUpInput {
  name: string
  email: string
  password: string
}

export interface LoginInput {
  email: string
  password: string
}
