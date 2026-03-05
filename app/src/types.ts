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
  type?: 'mc' | 'short_answer' | 'mapping' | 'multi_truefalse'
  sourcePage?: number
}
