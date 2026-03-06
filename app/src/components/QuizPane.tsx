import React, { useMemo, useState } from 'react'
import type { Quiz } from '../types'
import { scoreQuiz } from '../scoring'

const SHOW_EXPORT = false // zet op true als je de CSV-exportknop zichtbaar wilt maken

type Props = { quiz: Quiz; onJumpToPage?: (page: number) => void }

type Submission = {
  studentName: string
  quizTitle: string
  createdAt: string
  answers: Record<string, string>
  score: number
  maxScore: number
}

async function loadConfig(): Promise<any> {
  try {
    const res = await fetch('./config.json', { cache: 'no-store' })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

async function logToGoogleSheets(payload: any): Promise<{ ok: boolean; message?: string }> {
  const cfg = await loadConfig()
  const logging = cfg?.logging
  if (!logging?.enabled) return { ok: true }
  if (logging.provider !== 'google_apps_script') return { ok: true }

  const url = (logging.appsScriptUrl ?? '').toString().trim()
  if (!url || url.includes('PASTE_YOUR_GOOGLE')) {
    return { ok: false, message: 'Logging staat aan, maar appsScriptUrl is nog niet ingesteld in app/public/config.json.' }
  }

  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), Number(logging.timeoutMs ?? 8000))

  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    // no-cors gives an opaque response; if fetch didn't throw, assume ok.
    return { ok: true }
  } catch (e: any) {
    return { ok: false, message: e?.name === 'AbortError' ? 'Google log timeout.' : (e?.message ?? String(e)) }
  } finally {
    clearTimeout(t)
  }
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

  async function handleSubmit() {
    if (!canSubmit) { alert('Vul eerst je naam in.'); return }
    setSubmitted({ score, maxScore, details: scored })

    const submission: Submission = {
      studentName: studentName.trim(),
      quizTitle: quiz.title,
      createdAt: new Date().toISOString(),
      answers,
      score,
      maxScore,
    }

    // Local log (per apparaat)
    const key = 'pdf-quizzer-submissions'
    const existing = JSON.parse(localStorage.getItem(key) || '[]') as Submission[]
    existing.push(submission)
    localStorage.setItem(key, JSON.stringify(existing))

    // Central log (Google Sheets)
    const result = await logToGoogleSheets({
      kind: 'submission',
      studentName: submission.studentName,
      quizTitle: submission.quizTitle,
      createdAt: submission.createdAt,
      score: submission.score,
      maxScore: submission.maxScore,
      answers: submission.answers,
    })

    if (result.ok) {
      alert('Ingeleverd! ✅')
    } else {
      alert(`Ingeleverd (lokaal) ✅\nMaar upload naar Google Sheets mislukte:\n${result.message ?? 'onbekend'}`)
    }
  }

  function exportCsv() {
    const key = 'pdf-quizzer-submissions'
    const rows = (JSON.parse(localStorage.getItem(key) || '[]') as Submission[])
    if (!rows.length) { alert('Nog geen inzendingen op dit apparaat.'); return }

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
          const labelNum = (q.number ?? (idx + 1))

          const parts = (q.text ?? '').split(/\r?\n/)
          const head = (parts[0] ?? '').trim()
          const body = parts.slice(1).join('\n').trim()

          return (
            <div key={q.id} style={{ background: '#11131a', border: '1px solid #22263a', borderRadius: 12, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 6 }}>
                Vraag {labelNum}
                {q.textRef ? ` • ${q.textRef}` : ''}
                {q.points ? ` • ${q.points}p` : ''}
              </div>

              <div style={{ marginBottom: 8 }}>
                {head && <div style={{ fontWeight: 700, whiteSpace: 'pre-wrap' }}>{head}</div>}
                {body && <div style={{ fontWeight: 400, whiteSpace: 'pre-wrap', marginTop: 6, opacity: 0.95 }}>{body}</div>}
              </div>

              {typeof (q as any).sourcePage === 'number' && onJumpToPage && (
                <button
                  onClick={() => onJumpToPage((q as any).sourcePage)}
                  style={{ marginBottom: 10, padding: '6px 10px', borderRadius: 10, border: '1px solid #2a2f48', background: '#151826', color: '#e9edf3', cursor: 'pointer' }}
                >
                  {q.textRef ? `Ga naar ${q.textRef} (pagina ${(q as any).sourcePage})` : `Ga naar pagina ${(q as any).sourcePage} in tekst`}
                </button>
              )}

              {q.type === 'multi_truefalse' && q.statements && q.tfChoices ? (
                <div style={{ display: 'grid', gap: 10 }}>
                  {q.statements.map((st) => {
                    const key = `${q.id}.${st.id}`
                    const chosenTF = answers[key] ?? ''
                    return (
                      <div key={st.id} style={{ border: '1px solid #2a2f48', borderRadius: 10, padding: 10 }}>
                        <div style={{ marginBottom: 8 }}>{st.id}. {st.text}</div>
                        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                          {q.tfChoices!.map((c) => (
                            <label key={c} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <input
                                type="radio"
                                name={key}
                                value={c}
                                checked={chosenTF === c}
                                onChange={() => setAnswers(a => ({ ...a, [key]: c }))}
                              />
                              <span>{c}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : q.type === 'mapping' && q.parts ? (
                <div style={{ display: 'grid', gap: 10 }}>
                  {q.parts.map((p) => {
                    const key = `${q.id}.${p.id}`
                    const chosenMap = (answers[key] ?? '').toString()
                    return (
                      <div key={p.id} style={{ display: 'flex', gap: 10, alignItems: 'center', border: '1px solid #2a2f48', borderRadius: 10, padding: 10 }}>
                        <div style={{ flex: 1 }}>{p.label}</div>
                        <select
                          value={chosenMap}
                          onChange={(e) => setAnswers(a => ({ ...a, [key]: e.target.value }))}
                          style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #2a2f48', background: '#0b0c0f', color: '#e9edf3' }}
                        >
                          <option value="">—</option>
                          {['a','b','c','d'].map((c) => (
                            <option key={c} value={c}>{c.toUpperCase()}</option>
                          ))}
                        </select>
                      </div>
                    )
                  })}
                </div>
              ) : q.options ? (
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
                      <div style={{ fontWeight: 400 }}><b>{key}</b> — {label}</div>
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
                <div style={{ marginTop: 10, padding: 10, borderRadius: 10, border: '1px solid #2a2f48', background: result.isFullyCorrect ? '#0f2a1a' : '#2a1212' }}>
                  <div style={{ fontWeight: 800 }}>
                    {result.isFullyCorrect ? '✅ Goed' : '❌ (Deels) fout'} — {result.pointsEarned} / {result.pointsPossible} p
                  </div>
                  {result.feedbackText && <div style={{ marginTop: 6, opacity: 0.9 }}>{result.feedbackText}</div>}
                </div>
              )}
            </div>
          )
        })}
      </div>
      {/* Acties pas onderaan zichtbaar (na alle vragen) */}
      <div style={{ marginTop: 14, padding: 12, background: '#11131a', border: '1px solid #22263a', borderRadius: 12 }}>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            onClick={() => { void handleSubmit() }}
            style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #2a2f48', background: '#1b3a8a', color: '#e9edf3', cursor: 'pointer' }}
          >
            Inleveren
          </button>

          {SHOW_EXPORT && (
            <button
              onClick={exportCsv}
              style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #2a2f48', background: '#151826', color: '#e9edf3', cursor: 'pointer' }}
            >
              Export CSV (docent)
            </button>
          )}
        </div>
</div>
    </div>
  )
}
