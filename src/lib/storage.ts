import { GradedSubmission } from '../components/ResultsPane'

const KEY = 'pdf-quizzer-submissions-v1'

function readAll(): GradedSubmission[]{
  try{
    const raw = localStorage.getItem(KEY)
    if(!raw) return []
    return JSON.parse(raw)
  }catch{
    return []
  }
}

function writeAll(items: GradedSubmission[]){
  localStorage.setItem(KEY, JSON.stringify(items))
}

export function saveSubmissionLocal(sub: GradedSubmission){
  const all = readAll()
  all.push(sub)
  writeAll(all)
}

export function exportSubmissionsCsv(quizSlug: string){
  const all = readAll().filter(s => s.quizSlug === quizSlug)
  const rows: string[] = []
  const header = ['createdAt','studentName','score','maxScore','answers_json']
  rows.push(header.join(','))
  for(const s of all){
    const line = [
      s.createdAt,
      s.studentName.replaceAll('"','""'),
      String(s.score),
      String(s.maxScore),
      JSON.stringify(s.answers).replaceAll('"','""')
    ].map(v => '"'+v+'"').join(',')
    rows.push(line)
  }
  const blob = new Blob([rows.join('\n')], { type:'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `submissions_${quizSlug}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
