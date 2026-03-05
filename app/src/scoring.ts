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
    const chosen = (answers[q.id] ?? '').toString().trim().toUpperCase()
    const correct = (q.correct ?? '').toString().trim().toUpperCase()
    const isCorrect = chosen !== '' && correct !== '' && chosen === correct

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

  const score = scored.reduce((acc, s) => acc + (s.isCorrect ? 1 : 0), 0)
  return { score, maxScore: quiz.questions.length, scored }
}
