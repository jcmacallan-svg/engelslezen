import type { Quiz } from './types'

export type ScoredQuestion = {
  id: string
  isCorrect: boolean
  chosen?: string
  correct?: string
  feedbackText?: string
}

export function scoreQuiz(quiz: Quiz, answers: Record<string, string>) {
  const scored: ScoredQuestion[] = quiz.questions.map(q => {
    const chosen = answers[q.id]
    const correct = q.correct ?? ''
    const isCorrect = chosen !== undefined && correct !== '' && chosen === correct

    let feedbackText = ''
    if (q.feedback) {
      if ('correct' in (q.feedback as any) || 'wrong' in (q.feedback as any)) {
        const fb = q.feedback as any
        feedbackText = isCorrect ? (fb.correct ?? '') : (fb.wrong ?? '')
      } else {
        const fb = q.feedback as Record<string, string>
        if (chosen && fb[chosen]) feedbackText = fb[chosen]
      }
    }

    return { id: q.id, isCorrect, chosen, correct, feedbackText }
  })

  // score by points if present, else 1 per question
  const score = quiz.questions.reduce((acc, q) => {
    const s = scored.find(x => x.id === q.id)
    const pts = q.points ?? 1
    return acc + (s?.isCorrect ? pts : 0)
  }, 0)

  const maxScore = quiz.questions.reduce((acc, q) => acc + (q.points ?? 1), 0)
  return { score, maxScore, scored }
}
