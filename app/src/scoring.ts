import type { Quiz, Question } from './types'

export type ScoredQuestion = {
  id: string
  pointsEarned: number
  pointsPossible: number
  isFullyCorrect: boolean
  feedbackText?: string
}

function norm(v: any) {
  return (v ?? '').toString().trim().toLowerCase()
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

export function scoreQuiz(quiz: Quiz, answers: Record<string, string>) {
  const scored: ScoredQuestion[] = quiz.questions.map((q) => scoreQuestion(q, answers))
  const score = scored.reduce((acc, s) => acc + s.pointsEarned, 0)
  const maxScore = scored.reduce((acc, s) => acc + s.pointsPossible, 0)
  return { score: round2(score), maxScore: round2(maxScore), scored }
}

function scoreQuestion(q: Question, answers: Record<string, string>): ScoredQuestion {
  const pointsPossible = Number(q.points ?? 1)

  // Multi true/false: qid.statementId keys (e.g. q5.1)
  if (q.type === 'multi_truefalse' && q.statements?.length && q.tfAnswerKey) {
    const per = pointsPossible / q.statements.length
    let earned = 0
    let allCorrect = true

    for (const st of q.statements) {
      const key = `${q.id}.${st.id}`
      const chosen = norm(answers[key])
      const correct = norm(q.tfAnswerKey[st.id])
      if (chosen && correct && chosen === correct) {
        earned += per
      } else {
        allCorrect = false
      }
    }

    earned = round2(earned)
    const feedbackText = pickFeedback(q, allCorrect)
    return { id: q.id, pointsEarned: earned, pointsPossible, isFullyCorrect: allCorrect, feedbackText }
  }

  // Mapping: qid.partId keys (e.g. q31.1), compare letter a/b/c/d
  if (q.type === 'mapping' && q.parts?.length) {
    const answerKey = q.mapAnswerKey ?? Object.fromEntries(q.parts.map(p => [p.id, p.answer ?? '']))
    const per = pointsPossible / q.parts.length
    let earned = 0
    let allCorrect = true

    for (const p of q.parts) {
      const key = `${q.id}.${p.id}`
      const chosen = norm(answers[key])
      const correct = norm(answerKey[p.id])
      if (chosen && correct && chosen === correct) {
        earned += per
      } else {
        allCorrect = false
      }
    }

    earned = round2(earned)
    const feedbackText = pickFeedback(q, allCorrect)
    return { id: q.id, pointsEarned: earned, pointsPossible, isFullyCorrect: allCorrect, feedbackText }
  }

  // Standard MC / short answer
  const chosen = norm(answers[q.id])
  const correct = norm(q.correct)
  const isCorrect = chosen !== '' && correct !== '' && chosen === correct
  const earned = isCorrect ? pointsPossible : 0
  const feedbackText = pickFeedback(q, isCorrect)
  return { id: q.id, pointsEarned: earned, pointsPossible, isFullyCorrect: isCorrect, feedbackText }
}

function pickFeedback(q: Question, isCorrect: boolean): string {
  if (!q.feedback) return ''
  const fb: any = q.feedback
  if (typeof fb === 'object' && (fb.correct !== undefined || fb.wrong !== undefined)) {
    return isCorrect ? (fb.correct ?? '') : (fb.wrong ?? '')
  }
  return ''
}
