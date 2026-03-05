export type Question = {
  id: string
  text: string
  options?: Record<string, string>

  // nieuw:
  number?: number
  points?: number
  textRef?: string // bv "Tekst 1" of "Artikel A"

  correct?: string
  feedback?: Record<string, string> | { correct?: string; wrong?: string }

  // compat met jouw quiz.json:
  stem?: string
  answerKey?: string
  feedbackCorrect?: string
  feedbackIncorrect?: string
}
