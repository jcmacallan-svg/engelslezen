import { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

export default function PdfPane({ pdfUrl }:{ pdfUrl: string }){
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [pdf, setPdf] = useState<any>(null)
  const [pageNum, setPageNum] = useState(1)
  const [numPages, setNumPages] = useState(1)
  const [scale, setScale] = useState(1.2)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const loadingTask = pdfjsLib.getDocument(pdfUrl)
      const doc = await loadingTask.promise
      if(cancelled) return
      setPdf(doc)
      setNumPages(doc.numPages)
      setPageNum(1)
    })().catch(console.error)
    return () => { cancelled = true }
  }, [pdfUrl])

  useEffect(() => {
    if(!pdf || !canvasRef.current) return
    ;(async () => {
      const page = await pdf.getPage(pageNum)
      const viewport = page.getViewport({ scale })
      const canvas = canvasRef.current!
      const ctx = canvas.getContext('2d')!
      canvas.height = viewport.height
      canvas.width = viewport.width
      await page.render({ canvasContext: ctx, viewport }).promise
    })().catch(console.error)
  }, [pdf, pageNum, scale])

  return (
    <div className="pdfWrap">
      <div className="row">
        <button className="btn" onClick={() => setPageNum(p => Math.max(1, p-1))} disabled={pageNum<=1}>←</button>
        <span className="small">Pagina {pageNum} / {numPages}</span>
        <button className="btn" onClick={() => setPageNum(p => Math.min(numPages, p+1))} disabled={pageNum>=numPages}>→</button>
        <span style={{flex:1}} />
        <button className="btn" onClick={() => setScale(s => Math.max(0.8, +(s-0.1).toFixed(2)))}>-</button>
        <span className="small">Zoom {Math.round(scale*100)}%</span>
        <button className="btn" onClick={() => setScale(s => Math.min(2.0, +(s+0.1).toFixed(2)))}>+</button>
      </div>
      <div style={{overflow:'auto'}}>
        <canvas ref={canvasRef} style={{maxWidth:'100%', border:'1px solid #e5e7eb', borderRadius:12}} />
      </div>
    </div>
  )
}
