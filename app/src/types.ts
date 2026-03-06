export type Quiz = {
  title: string
  questions: Question[]
}

export type TrueFalseStatement = {
  id: string
  text: string
}

export type MappingPart = {
  id: string
  label: string
  answer?: string
}

export type Question = {
  id: string
  text: string

  // MC
  options?: Record<string, string>
  correct?: string

  // Feedback
  feedback?: Record<string, string> | { correct?: string; wrong?: string }

  // Metadata
  number?: number
  points?: number
  textRef?: string
  sourcePage?: number

  // Types
  type?: 'mc' | 'short_answer' | 'mapping' | 'multi_truefalse'

  // Multi true/false
  statements?: TrueFalseStatement[]
  tfChoices?: string[]              // e.g. ['wel','niet']
  tfAnswerKey?: Record<string, string> // statementId -> choice

  // Mapping
  parts?: MappingPart[]
  mapChoices?: string[]             // e.g. ['a','b','c','d']
  mapAnswerKey?: Record<string, string> // partId -> letter

  // compat (raw fields, optional)
  stem?: string
  answerKey?: any
  feedbackCorrect?: string
  feedbackIncorrect?: string
}
