import { QuizDefinition } from '../lib/types'

export type GradedSubmission = {
  quizSlug: string
  studentName: string
  createdAt: string
  answers: Record<string, any>
  score: number
  maxScore: number
  perQuestion: Record<string, { points: number, maxPoints: number, correct: boolean, feedback: string }>
}

export default function ResultsPane({ quiz, submission, onBack }:{
  quiz: QuizDefinition
  submission: GradedSubmission
  onBack: ()=>void
}){
  return (
    <div style={{padding:12}}>
      <div className="card">
        <h2 style={{marginTop:0}}>Resultaat</h2>
        <div className="row">
          <div><strong>{submission.studentName}</strong></div>
          <div className="badge">{new Date(submission.createdAt).toLocaleString()}</div>
          <div className="badge">Score {submission.score} / {submission.maxScore}</div>
        </div>
        <div className="hr" />
        <button className="btn" onClick={onBack}>Terug naar vragen</button>
      </div>

      {quiz.questions.map(q => {
        const r = submission.perQuestion[q.id]
        const cls = r.correct ? 'resultGood' : 'resultBad'
        return (
          <div key={q.id} className={'q ' + cls}>
            <h3>Vraag {q.number} <span className="small">({r.points}/{r.maxPoints}p)</span></h3>
            <div className="small" style={{whiteSpace:'pre-wrap'}}>{q.stem}</div>
            <div style={{marginTop:8}}><strong>Feedback:</strong> {r.feedback}</div>
          </div>
        )
      })}
    </div>
  )
}
