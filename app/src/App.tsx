import React, { useEffect, useMemo, useState } from 'react'
import { Route, Routes, Link, useParams, Navigate } from 'react-router-dom'
import { PdfPane } from './components/PdfPane'
import { QuizPane } from './components/QuizPane'
import type { Quiz } from './types'
import './styles.css'

function getTextRefFromQuestionNumber(n: number): string | undefined {
  // Mapping provided by teacher for CSE 2019 tijdvak 2
  if (n === 1) return 'Tekst 1'
  if (n === 2) return 'Tekst 2'
  if (n === 3) return 'Tekst 3'
  if (n >= 4 && n <= 6) return 'Tekst 4'
  if (n >= 7 && n <= 12) return 'Tekst 5'
  if (n >= 13 && n <= 18) return 'Tekst 6'
  if (n >= 19 && n <= 23) return 'Tekst 7'
  if (n >= 24 && n <= 29) return 'Tekst 8'
  if (n >= 30 && n <= 33) return 'Tekst 9'
  if (n >= 34 && n <= 38) return 'Tekst 10'
  if (n === 39) return 'Tekst 11'
  if (n === 40) return 'Tekst 12'
  if (n === 41) return 'Tekst 13'
  if (n === 42) return 'Tekst 14'
  return undefined
}

function getStartPageFromTextRef(textRef?: string): number | undefined {
  // 1-indexed PDF pages (as shown in the viewer)
  switch ((textRef ?? '').trim()) {
    case 'Tekst 1': return 2
    case 'Tekst 2': return 3
    case 'Tekst 3': return 4
    case 'Tekst 4': return 5
    case 'Tekst 5': return 6
    case 'Tekst 6': return 8
    case 'Tekst 7': return 10
    case 'Tekst 8': return 12
    case 'Tekst 9': return 14
    case 'Tekst 10': return 16
    case 'Tekst 11': return 18
    case 'Tekst 12': return 19
    case 'Tekst 13': return 20
    case 'Tekst 14': return 21
    default: return undefined
  }
}

function cleanQuestionText(s: string): string {
  return (s ?? '')
    // GT footers with or without hyphens, plus any trailing content
    .replace(/^\s*GT\s*-?\s*\d+.*$/gmi, '')
    .replace(/^\s*GT\s*\d+[A-Za-z0-9\-]*.*$/gmi, '')
    // common "lees verder" lines
    .replace(/^\s*lees\s*verder.*$/gmi, '')
    .replace(/^\s*\d+\s*\/\s*\d+\s*lees\s*verder.*$/gmi, '')
    // arrows at end of a line
    .replace(/[►▶>]{2,}\s*$/gmi, '')
    // collapse empty lines
    .split(/\r?\n/)
    .map(l => l.trimEnd())
    .filter(l => l.trim() !== '')
    .join('\n')
    .trim()
}

function formatQuestion3Text(text: string): string {
  // Normalize formatting for vraag 3: make the instruction bold-able (rendered bold on first block)
  // and keep hard enters only where they help readability.
  const cleaned = (text ?? '').trim()

  // Split instruction part from bracket parts (e.g. [A], [B], [C])
  const lines = cleaned.split(/\r?\n/)
  const firstBracketIdx = lines.findIndex(l => /^\[[A-Za-z]\]/.test(l.trim()))
  const instructionLines = (firstBracketIdx === -1 ? lines : lines.slice(0, firstBracketIdx)).join(' ').replace(/\s+/g, ' ').trim()
  const bracketLines = (firstBracketIdx === -1 ? [] : lines.slice(firstBracketIdx))

  // Force the instruction sentence(s) as requested
  const instr1 = "De volgende drie alinea's van tekst 3 staan hieronder, maar niet in de juiste volgorde."
  const instr2 = "► Schrijf de letters van de alinea's in de juiste volgorde op in de uitwerkbijlagen."

  // Rebuild bracket blocks: each [X] block stays together; blank line between blocks
  const blocks: string[] = []
  let current: string[] = []
  for (const l of bracketLines) {
    const t = l.trim()
    if (!t) continue
    if (/^\[[A-Za-z]\]/.test(t)) {
      if (current.length) blocks.push(current.join(' '))
      current = [t]
    } else {
      current.push(t)
    }
  }
  if (current.length) blocks.push(current.join(' '))

  const bracketText = blocks.length ? ('\n\n' + blocks.join('\n\n')) : ''
  return `${instr1}\n${instr2}${bracketText}`.trim()
}

function toOptions(q: any): Record<string, string> | undefined {
  if (q.options && typeof q.options === 'object' && !Array.isArray(q.options)) return q.options

  const arr = q.choices ?? q.answers ?? q.options
  if (Array.isArray(arr)) {
    if (arr.every((x: any) => typeof x === 'string')) {
      const letters = ['A','B','C','D','E','F']
      const out: Record<string, string> = {}
      arr.forEach((txt: string, i: number) => { out[letters[i] ?? String(i+1)] = String(txt) })
      return Object.keys(out).length ? out : undefined
    }
    const out: Record<string, string> = {}
    for (const item of arr) {
      const k = (item.key ?? item.letter ?? item.id ?? '').toString().trim().toUpperCase()
      const t = (item.text ?? item.label ?? item.value ?? '').toString().trim()
      if (k && t) out[k] = t
    }
    return Object.keys(out).length ? out : undefined
  }

  const rawText = cleanQuestionText((q.text ?? q.stem ?? q.prompt ?? q.question ?? '').toString())
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const opt: Record<string, string> = {}
  for (const line of lines) {
    const m = line.match(/^([A-F])\s*[\)\.\:\-]\s*(.+)$/i)
    if (m) opt[m[1].toUpperCase()] = m[2].trim()
  }
  return Object.keys(opt).length >= 2 ? opt : undefined
}

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
            const options = toOptions(q)
            return {
              id: (q.id ?? q.qid ?? `q${q.number ?? idx + 1}`).toString(),
              number: q.number ?? q.nr ?? idx + 1,
              points: q.points ?? q.punten,
              textRef: q.textRef ?? q.tekst ?? q.article ?? q.textLabel ?? getTextRefFromQuestionNumber((q.number ?? q.nr ?? (idx + 1)) as number),

              text: (() => {
                const base = cleanQuestionText((q.text ?? q.stem ?? q.prompt ?? q.question ?? '').toString())
                const n = (q.number ?? q.nr ?? (idx + 1)) as number
                return n === 3 ? formatQuestion3Text(base) : base
              })(),
              type: q.type ?? (options ? 'mc' : 'short_answer'),
              statements: q.statements,
              tfChoices: q.choices,
              tfAnswerKey: (q.type === 'multi_truefalse' ? q.answerKey : undefined),
              parts: q.parts,
              mapChoices: ['a','b','c','d'],
              mapAnswerKey: (q.type === 'mapping' ? Object.fromEntries((q.parts ?? []).map((p: any) => [p.id, p.answer])) : undefined),
              options,
              correct: (typeof q.answerKey === 'string' ? q.answerKey : (q.correct ?? q.answer ?? '')).toString().trim().toUpperCase(),
              feedback: q.feedback ?? ((q.feedbackCorrect || q.feedbackIncorrect) ? { correct: q.feedbackCorrect, wrong: q.feedbackIncorrect } : undefined),
              sourcePage: (q.sourcePage ?? getStartPageFromTextRef((q.textRef ?? q.tekst ?? q.article ?? q.textLabel ?? getTextRefFromQuestionNumber((q.number ?? q.nr ?? (idx + 1)) as number)) as any))
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
  const [jumpPage, setJumpPage] = useState<number>(1)

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

  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', gap: 12, padding: 12 }}>
      <div style={{ width: '55%', minWidth: 0, position: 'sticky', top: 12, alignSelf: 'flex-start', height: 'calc(100vh - 24px)' }}>
        <PdfPane url={pdfUrl} page={jumpPage} />
      </div>
      <div style={{ flex: 1, minWidth: 0, height: 'calc(100vh - 24px)', overflow: 'auto' }}>
        <QuizPane quiz={quiz} onJumpToPage={(p) => setJumpPage(p)} />
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
