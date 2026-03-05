import { QuizDefinition } from '../lib/types'

export default function QuizPane(props:{
  quiz: QuizDefinition
  studentName: string
  setStudentName: (v:string)=>void
  answers: Record<string, any>
  setAnswers: (a: Record<string, any>)=>void
  onSubmit: ()=>void
}){
  const { quiz, studentName, setStudentName, answers, setAnswers, onSubmit } = props

  function setAnswer(qid: string, value: any){
    setAnswers({ ...answers, [qid]: value })
  }

  return (
    <div style={{padding:12}}>
      <div className="card">
        <div className="row">
          <label className="small"><strong>Naam leerling</strong></label>
          <input className="input" value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="Voornaam + achternaam" />
          <span className="small">({quiz.questions.length} vragen)</span>
        </div>
        <div className="hr" />
        <button className="btn btnPrimary" onClick={onSubmit}>Inleveren & nakijken</button>
      </div>

      {quiz.questions.map(q => (
        <div className="q" key={q.id}>
          <h3>Vraag {q.number} <span className="small">({q.points}p)</span></h3>
          <div style={{whiteSpace:'pre-wrap'}}>{q.stem}</div>

          {q.type === 'multiple_choice' && q.options ? (
            <div style={{marginTop:8}}>
              {Object.entries(q.options).map(([k, txt]) => (
                <div className="opt" key={k}>
                  <input
                    type="radio"
                    name={q.id}
                    checked={answers[q.id] === k}
                    onChange={() => setAnswer(q.id, k)}
                  />
                  <label><strong>{k}</strong> {txt}</label>
                </div>
              ))}
            </div>
          ) : null}

          {q.type === 'multi_truefalse' && q.statements ? (
            <div style={{marginTop:8}}>
              {q.statements.map(st => (
                <div key={st.id} className="card" style={{marginTop:8}}>
                  <div className="small"><strong>{st.id}.</strong> {st.text}</div>
                  <div className="row" style={{marginTop:6}}>
                    {q.choices?.map(ch => (
                      <label key={ch} className="opt" style={{margin:0}}>
                        <input
                          type="radio"
                          name={q.id + '_' + st.id}
                          checked={(answers[q.id]?.[st.id] ?? '') === ch}
                          onChange={() => setAnswer(q.id, { ...(answers[q.id] ?? {}), [st.id]: ch })}
                        />
                        {ch}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {(q.type === 'short_answer') ? (
            <div style={{marginTop:8}}>
              <input
                className="input"
                style={{width:'100%', minWidth: 0}}
                value={answers[q.id] ?? ''}
                onChange={e => setAnswer(q.id, e.target.value)}
                placeholder="Typ je antwoord…"
              />
              <div className="small" style={{marginTop:6}}>Let op: sommige open vragen worden alleen “streng” automatisch nagekeken.</div>
            </div>
          ) : null}

          {(q.type === 'mapping' && q.parts) ? (
            <div style={{marginTop:8}}>
              {q.parts.map(p => (
                <div key={p.id} className="row" style={{marginTop:8}}>
                  <span className="small" style={{minWidth:260}}><strong>{p.label}</strong></span>
                  <input
                    className="input"
                    value={answers[q.id]?.[p.id] ?? ''}
                    onChange={e => setAnswer(q.id, { ...(answers[q.id] ?? {}), [p.id]: e.target.value })}
                    placeholder="antwoord"
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}
