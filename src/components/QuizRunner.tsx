import { useEffect, useMemo, useState } from 'react'
import PdfPane from './PdfPane'
import QuizPane from './QuizPane'
import ResultsPane, { GradedSubmission } from './ResultsPane'
import { gradeSubmission } from '../lib/scoring'
import { loadQuiz, QuizDefinition } from '../lib/types'
import { saveSubmissionLocal, exportSubmissionsCsv } from '../lib/storage'

export default function QuizRunner({ slug }:{ slug: string }){
  const [quiz, setQuiz] = useState<QuizDefinition | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [studentName, setStudentName] = useState('')
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [graded, setGraded] = useState<GradedSubmission | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    loadQuiz(slug).then(q => {
      if(cancelled) return
      setQuiz(q)
      setLoading(false)
      setAnswers({})
      setGraded(null)
    }).catch(e => {
      if(cancelled) return
      setError(String(e?.message ?? e))
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [slug])

  const sourcePdfUrl = useMemo(() => `/quizzes/${slug}/source.pdf`, [slug])

  if(loading) return <div style={{padding:16}}>Laden…</div>
  if(error || !quiz) return <div style={{padding:16}}>Kon quiz niet laden: {error}</div>

  function submit(){
    const name = studentName.trim()
    if(!name){ alert('Vul je naam in.'); return }
    const g = gradeSubmission(quiz, answers)
    const submission: GradedSubmission = {
      quizSlug: slug,
      studentName: name,
      createdAt: new Date().toISOString(),
      answers,
      ...g,
    }
    setGraded(submission)
    saveSubmissionLocal(submission)
  }

  function reset(){
    setAnswers({})
    setGraded(null)
  }

  return (
    <div className="container">
      <div className="pane" style={{width:'55%'}}>
        <div className="paneHeader">
          <div>
            <strong>{quiz.title}</strong>
            <div className="small">Bron-PDF</div>
          </div>
        </div>
        <div className="paneBody">
          <PdfPane pdfUrl={sourcePdfUrl} />
        </div>
      </div>

      <div className="paneRight">
        <div className="paneHeader">
          <div>
            <strong>Vragen</strong>
            <div className="small">Naam + antwoorden worden gelogd (lokaal in deze browser)</div>
          </div>
          <div className="row">
            <button className="btn" onClick={() => exportSubmissionsCsv(slug)}>Download CSV</button>
            {graded ? <button className="btn" onClick={reset}>Opnieuw</button> : null}
          </div>
        </div>

        <div className="paneBody">
          {graded ? (
            <ResultsPane quiz={quiz} submission={graded} onBack={reset} />
          ) : (
            <QuizPane
              quiz={quiz}
              studentName={studentName}
              setStudentName={setStudentName}
              answers={answers}
              setAnswers={setAnswers}
              onSubmit={submit}
            />
          )}
        </div>
      </div>
    </div>
  )
}
