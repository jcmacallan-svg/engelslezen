export type Quiz = {
  title: string
  questions: Question[]
}

export type Question = {
  id: string
  text: string

  // metadata (optional)
  number?: number
  points?: number
  textRef?: string
  sourcePage?: number

  // MC options
  options?: Record<string, string>

  // answer key for MC
  correct?: string

  // feedback per option or correct/wrong
  feedback?: Record<string, string> | { correct?: string; wrong?: string }

  // compatibility fields (if present in raw JSON)
  stem?: string
  answerKey?: string
  feedbackCorrect?: string
  feedbackIncorrect?: string
}
