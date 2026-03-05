export type QuizDefinition = {
  slug?: string
  title: string
  sourcePdf: string
  questions: Question[]
}

export type Question =
  | MultipleChoiceQuestion
  | ShortAnswerQuestion
  | MultiTrueFalseQuestion
  | MappingQuestion

export type MultipleChoiceQuestion = {
  id: string
  number: number
  type: 'multiple_choice'
  points: number
  stem: string
  options: Record<string,string>
  answerKey: string
  feedbackCorrect?: string
  feedbackIncorrect?: string
}

export type ShortAnswerQuestion = {
  id: string
  number: number
  type: 'short_answer'
  points: number
  stem: string
  answerKey?: string[]
  match?: 'starts_with_words'|'contains_any'|'normalize_letters'|'numeric'|'numeric_or_word'|'manual'
  rubric?: string
  feedbackCorrect?: string
  feedbackIncorrect?: string
}

export type MultiTrueFalseQuestion = {
  id: string
  number: number
  type: 'multi_truefalse'
  points: number
  stem: string
  statements: { id: string, text: string }[]
  choices: string[] // ['wel','niet']
  answerKey: Record<string,string>
  feedbackCorrect?: string
  feedbackIncorrect?: string
}

export type MappingQuestion = {
  id: string
  number: number
  type: 'mapping'
  points: number
  stem: string
  parts: { id: string, label: string, answer: string }[]
  feedbackCorrect?: string
  feedbackIncorrect?: string
}

export async function loadQuiz(slug: string): Promise<QuizDefinition>{
  const res = await fetch(`/quizzes/${slug}/quiz.json`, { cache: 'no-store' })
  if(!res.ok) throw new Error(`HTTP ${res.status} bij laden quiz.json`)
  return await res.json()
}
