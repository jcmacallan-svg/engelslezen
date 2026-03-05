import { QuizDefinition, Question } from './types'

function normalize(s: string){
  return (s ?? '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g,' ')
}

function normalizeLetters(s: string){
  return normalize(s).replace(/[^a-z]/g,'')
}

function isNumericAnswer(s: string){
  const t = normalize(s).replace(/[^0-9]/g,'')
  return t
}

export function gradeSubmission(quiz: QuizDefinition, answers: Record<string, any>){
  let score = 0
  const perQuestion: Record<string, { points: number, maxPoints: number, correct: boolean, feedback: string }> = {}
  let maxScore = 0

  for(const q of quiz.questions){
    maxScore += q.points
    const a = answers[q.id]

    if(q.type === 'multiple_choice'){
      const correct = (a ?? '') === q.answerKey
      const pts = correct ? q.points : 0
      score += pts
      perQuestion[q.id] = {
        points: pts,
        maxPoints: q.points,
        correct,
        feedback: correct ? (q.feedbackCorrect ?? 'Goed.') : (q.feedbackIncorrect ?? `Fout. Correct is ${q.answerKey}.`)
      }
      continue
    }

    if(q.type === 'multi_truefalse'){
      const student = (a ?? {}) as Record<string,string>
      const key = q.answerKey
      const total = q.statements.length
      let good = 0
      for(const st of q.statements){
        if((student[st.id] ?? '') === (key[st.id] ?? '')) good++
      }
      // punten volgens correctiemodel in meegeleverde set:
      // 4->2, 3->1, <=2->0  (bij 4 statements)
      // 3->2, 2->1, <=1->0  (bij 3 statements)
      // 2->1, <=1->0        (bij 2 statements)
      let pts = 0
      if(total === 4){
        pts = good === 4 ? 2 : good === 3 ? 1 : 0
      } else if(total === 3){
        pts = good === 3 ? 2 : good === 2 ? 1 : 0
      } else if(total === 2){
        pts = good === 2 ? 1 : 0
      } else {
        // fallback: proportioneel
        pts = Math.round((good/Math.max(1,total))*q.points)
      }
      const correct = pts === q.points
      score += pts
      perQuestion[q.id] = {
        points: pts,
        maxPoints: q.points,
        correct,
        feedback: correct ? (q.feedbackCorrect ?? 'Goed.') : (q.feedbackIncorrect ?? 'Niet helemaal goed.')
      }
      continue
    }

    if(q.type === 'mapping'){
      const student = (a ?? {}) as Record<string,string>
      let good = 0
      for(const p of q.parts){
        if(normalize(student[p.id] ?? '') === normalize(p.answer)) good++
      }
      let pts = 0
      if(q.parts.length === 3){
        pts = good === 3 ? 2 : good === 2 ? 1 : 0
      } else {
        pts = Math.round((good/Math.max(1,q.parts.length))*q.points)
      }
      const correct = pts === q.points
      score += pts
      perQuestion[q.id] = {
        points: pts,
        maxPoints: q.points,
        correct,
        feedback: correct ? (q.feedbackCorrect ?? 'Goed.') : (q.feedbackIncorrect ?? 'Niet helemaal goed.')
      }
      continue
    }

    if(q.type === 'short_answer'){
      const student = (a ?? '').toString()
      const key = q.answerKey ?? []
      const match = q.match ?? 'manual'
      let correct = false

      if(match === 'starts_with_words'){
        correct = key.some(k => normalize(student).startsWith(normalize(k)))
      } else if(match === 'contains_any'){
        correct = key.some(k => normalize(student).includes(normalize(k)))
      } else if(match === 'normalize_letters'){
        const s = normalizeLetters(student)
        correct = key.some(k => normalizeLetters(k) === s)
      } else if(match === 'numeric'){
        const s = isNumericAnswer(student)
        correct = key.some(k => isNumericAnswer(k) === s)
      } else if(match === 'numeric_or_word'){
        const s = isNumericAnswer(student)
        const words = normalize(student)
        correct = key.some(k => isNumericAnswer(k) === s || normalize(k) === words)
      } else {
        correct = false
      }

      const pts = correct ? q.points : 0
      score += pts
      perQuestion[q.id] = {
        points: pts,
        maxPoints: q.points,
        correct,
        feedback: correct ? (q.feedbackCorrect ?? 'Goed.') : (q.feedbackIncorrect ?? (q.rubric ? `Correctiemodel: ${q.rubric}` : 'Fout.'))
      }
      continue
    }
  }

  return { score, maxScore, perQuestion }
}
