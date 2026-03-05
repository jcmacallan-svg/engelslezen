import React, { useEffect, useMemo, useState } from 'react'
import { Route, Routes, Link, useParams, Navigate } from 'react-router-dom'
import { PdfPane } from './components/PdfPane'
import { QuizPane } from './components/QuizPane'
import type { Quiz } from './types'
import './styles.css'

function useQuiz(slug: string) {
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setErr(null)
      setQuiz(null)
      try {
        const res = await fetch(`./quizzes/${slug}/quiz.json`)
        if (!res.ok) throw new Error(`Kan quiz.json niet laden (${res.status})`)
       const raw = await res.json()

const normalized: Quiz = {
  title: raw.title ?? raw.name ?? 'Quiz',
  questions: (raw.questions ?? []).map((q: any, idx: number) => {
    const correct = (q.correct ?? q.answerKey ?? q.answer ?? '').toString().trim().toUpperCase()

    return {
      id: (q.id ?? q.qid ?? `q${q.number ?? idx + 1}`).toString(),
      // volledige vraag/opdracht:
      text: (q.text ?? q.stem ?? q.prompt ?? q.question ?? '').toString(),

      // multiple choice opties
      options: q.options ?? q.choices ?? q.answers ?? undefined,

      // juist antwoord
      correct,

      // punten / tekstlabel (als aanwezig in jouw JSON)
      points: q.points ?? q.punten ?? undefined,
      textRef: q.textRef ?? q.tekst ?? q.article ?? undefined,

      // feedback (als aanwezig)
      feedback:
        q.feedback ??
        (q.feedbackCorrect || q.feedbackIncorrect
          ? { correct: q.feedbackCorrect, wrong: q.feedbackIncorrect }
          : undefined),
    }
  }),
}

if (!cancelled) setQuiz(normalized)
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? String(e))
      }
    })()
    return () => { cancelled = true }
  }, [slug])

  return { quiz, err }
}

function Home() {
  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 16 }}>
      <h1>PDF Quizzer</h1>
      <p>Kies een set:</p>
      <ul>
        <li><Link to="/quiz/2019">Examen 2019 (demo)</Link></li>
      </ul>
      <p style={{ opacity: 0.8 }}>
        Tip: zet je eigen sets in <code>app/public/quizzes/&lt;slug&gt;/</code> met <code>source.pdf</code> + <code>quiz.json</code>.
      </p>
    </div>
  )
}

function QuizRoute() {
  const { slug } = useParams()
  const safeSlug = slug || '2019'
  const { quiz, err } = useQuiz(safeSlug)

  const pdfUrl = useMemo(() => `./quizzes/${safeSlug}/source.pdf`, [safeSlug])

  if (err) {
    return (
      <div style={{ padding: 16 }}>
        <Link to="/">← terug</Link>
        <h2>Fout</h2>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{err}</pre>
      </div>
    )
  }

  if (!quiz) return <div style={{ padding: 16 }}>Laden…</div>

  // Make right side scroll, keep PDF in view
  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', gap: 12, padding: 12 }}>
      <div style={{ width: '55%', minWidth: 0, position: 'sticky', top: 12, alignSelf: 'flex-start', height: 'calc(100vh - 24px)' }}>
        <PdfPane url={pdfUrl} />
      </div>

      <div style={{ flex: 1, minWidth: 0, height: 'calc(100vh - 24px)', overflow: 'auto' }}>
        <QuizPane quiz={quiz} />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/quiz/:slug" element={<QuizRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
