export type Quiz = {
  title: string
  questions: Question[]
}

export type Question = {
  id: string
  text: string
  options?: Record<string, string>
  correct?: string
  feedback?: Record<string, string> | { correct?: string; wrong?: string }

  number?: number
  points?: number
  textRef?: string

  // compat
  stem?: string
  answerKey?: string
  feedbackCorrect?: string
  feedbackIncorrect?: string
}
