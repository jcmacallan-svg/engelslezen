import React, { useMemo, useState } from 'react'
import type { Quiz } from '../types'
import { scoreQuiz } from '../scoring'

type Props = { quiz: Quiz; onJumpToPage?: (page: number) => void }

type Submission = {
  studentName: string
  quizTitle: string
  createdAt: string
  answers: Record<string, string>
  score: number
  maxScore: number
}

function download(filename: string, text: string) {
  const el = document.createElement('a')
  el.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text))
  el.setAttribute('download', filename)
  el.style.display = 'none'
  document.body.appendChild(el)
  el.click()
  document.body.removeChild(el)
}

export function QuizPane({ quiz, onJumpToPage }: Props) {
  const [studentName, setStudentName] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState<null | { score: number; maxScore: number; details: ReturnType<typeof scoreQuiz>['scored'] }>(null)

  const canSubmit = studentName.trim().length > 0
  const { score, maxScore, scored } = useMemo(() => scoreQuiz(quiz, answers), [quiz, answers])

  function handleSubmit() {
    if (!canSubmit) return
    setSubmitted({ score, maxScore, details: scored })

    const submission: Submission = {
      studentName: studentName.trim(),
      quizTitle: quiz.title,
      createdAt: new Date().toISOString(),
      answers,
      score,
      maxScore,
    }

    const key = 'pdf-quizzer-submissions'
    const existing = JSON.parse(localStorage.getItem(key) || '[]') as Submission[]
    existing.push(submission)
    localStorage.setItem(key, JSON.stringify(existing))
  }

  function exportCsv() {
    const key = 'pdf-quizzer-submissions'
    const rows = (JSON.parse(localStorage.getItem(key) || '[]') as Submission[])
    if (!rows.length) {
      alert('Nog geen inzendingen op dit apparaat.')
      return
    }

    const qids = quiz.questions.map(q => q.id)
    const header = ['createdAt', 'studentName', 'quizTitle', 'score', 'maxScore', ...qids]
    const csv = [
      header.join(','),
      ...rows.map(r => {
        const cols = [r.createdAt, r.studentName, r.quizTitle, String(r.score), String(r.maxScore), ...qids.map(id => (r.answers[id] ?? ''))]
        return cols.map(v => JSON.stringify(v)).join(',')
      })
    ].join('\n')

    download(`inzendingen_${new Date().toISOString().slice(0,10)}.csv`, csv)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: '#11131a', border: '1px solid #22263a', borderRadius: 12, padding: 12 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 14, opacity: 0.8 }}>Quiz</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{quiz.title}</div>
          </div>

          <div style={{ minWidth: 240 }}>
            <div style={{ fontSize: 14, opacity: 0.8 }}>Naam leerling</div>
            <input
              value={studentName}
              onChange={e => setStudentName(e.target.value)}
              placeholder="Voor- en achternaam"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #2a2f48', background: '#0b0c0f', color: '#e9edf3' }}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid #2a2f48',
              background: canSubmit ? '#1b3a8a' : '#151826',
              color: '#e9edf3',
              cursor: canSubmit ? 'pointer' : 'not-allowed'
            }}
          >
            Inleveren
          </button>

          <button
            onClick={exportCsv}
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid #2a2f48',
              background: '#151826',
              color: '#e9edf3',
              cursor: 'pointer'
            }}
          >
            Export CSV (docent)
          </button>
        </div>

        {submitted && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #22263a' }}>
            <div style={{ fontWeight: 700 }}>Resultaat: {submitted.score} / {submitted.maxScore}</div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>Feedback staat per vraag hieronder.</div>
          </div>
        )}
      </div>

      <div style={{ overflow: 'auto', paddingRight: 6 }}>
        {quiz.questions.map((q, idx) => {
          const chosen = answers[q.id] ?? ''
          const result = submitted?.details.find(d => d.id === q.id)
          return (
            <div key={q.id} style={{ background: '#11131a', border: '1px solid #22263a', borderRadius: 12, padding: 12, marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ fontWeight: 800 }}>{idx + 1}.</div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>{q.text}</div>

                  {typeof q.sourcePage === 'number' && onJumpToPage && (
                    <button
                      onClick={() => onJumpToPage(q.sourcePage!)}
                      style={{ marginBottom: 10, padding: '6px 10px', borderRadius: 10, border: '1px solid #2a2f48', background: '#151826', color: '#e9edf3', cursor: 'pointer' }}
                    >
                      Ga naar pagina {q.sourcePage} in tekst
                    </button>
                  )}

                  {q.options ? (
                    <div style={{ display: 'grid', gap: 8 }}>
                      {Object.entries(q.options).map(([key, label]) => (
                        <label key={key} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: 10, borderRadius: 10, border: '1px solid #2a2f48' }}>
                          <input
                            type="radio"
                            name={q.id}
                            value={key}
                            checked={chosen === key}
                            onChange={() => setAnswers(a => ({ ...a, [q.id]: key }))}
                          />
                          <div><b>{key}</b> — {label}</div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <input
                      value={chosen}
                      onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                      placeholder="Antwoord"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #2a2f48', background: '#0b0c0f', color: '#e9edf3' }}
                    />
                  )}

                  {submitted && result && (
                    <div style={{ marginTop: 10, padding: 10, borderRadius: 10, border: '1px solid #2a2f48', background: result.isCorrect ? '#0f2a1a' : '#2a1212' }}>
                      <div style={{ fontWeight: 800 }}>
                        {result.isCorrect ? '✅ Goed' : '❌ Fout'} {result.correct ? `(goed: ${result.correct})` : ''}
                      </div>
                      {result.feedbackText && <div style={{ marginTop: 6, opacity: 0.9 }}>{result.feedbackText}</div>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
