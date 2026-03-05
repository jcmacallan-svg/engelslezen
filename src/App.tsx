import { Routes, Route, Link, useParams, Navigate } from 'react-router-dom'
import QuizRunner from './components/QuizRunner'

export default function App(){
  return (
    <>
      <div className="header">
        <strong>PDF Quizzer</strong>
        <span className="badge">split-screen PDF + quiz</span>
        <div style={{marginLeft:'auto'}} className="row">
          <Link className="btn" to="/quiz/2019">Open demo (2019)</Link>
        </div>
      </div>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/quiz/:slug" element={<QuizRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

function Home(){
  return (
    <div style={{padding:16, maxWidth: 900}}>
      <div className="card">
        <h2 style={{marginTop:0}}>Wat is dit?</h2>
        <p>
          Een simpele webapp: links een PDF-tekstboekje, rechts (of onder) de vragen als invulbare quiz.
          Antwoorden worden direct nagekeken (waar mogelijk) en gelogd.
        </p>
        <div className="hr" />
        <p className="small">
          Tip: zet je eigen set in <code>public/quizzes/&lt;slug&gt;/</code> met een <code>source.pdf</code> en <code>quiz.json</code>.
        </p>
      </div>
    </div>
  )
}

function QuizRoute(){
  const { slug } = useParams()
  if(!slug) return <Navigate to="/" replace />
  return <QuizRunner slug={slug} />
}
