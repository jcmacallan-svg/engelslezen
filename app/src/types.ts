export type Quiz = {
  title: string
  instructions?: string
  questions: Question[]
}

export type Question = {
  id: string
  number: number
  textRef?: number
  points?: number
  text: string
  options?: Record<string, string>
  correct?: string
  feedback?: { correct?: string; wrong?: string } | Record<string, string>
}
