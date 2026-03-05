import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

type Props = { url: string; page?: number }

export function PdfPane({ url, page }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [pageNum, setPageNum] = useState<number>(page ?? 1)
  const [pageCount, setPageCount] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.25)

  useEffect(() => { setPageNum(page ?? 1) }, [page])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const loadingTask = pdfjsLib.getDocument(url)
      const doc = await loadingTask.promise
      if (cancelled) return
      setPdf(doc)
      setPageCount(doc.numPages)
    })().catch(console.error)
    return () => { cancelled = true }
  }, [url])

  const clampedPage = useMemo(() => Math.min(Math.max(pageNum, 1), pageCount), [pageNum, pageCount])

  useEffect(() => {
    if (!pdf) return
    let cancelled = false
    ;(async () => {
      const p = await pdf.getPage(clampedPage)
      if (cancelled) return
      const viewport = p.getViewport({ scale })
      const canvas = canvasRef.current
      if (!canvas) return
      const context = canvas.getContext('2d')
      if (!context) return
      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)
      await p.render({ canvasContext: context, viewport }).promise
    })().catch(console.error)
    return () => { cancelled = true }
  }, [pdf, clampedPage, scale])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => setPageNum(p => Math.max(1, p - 1))}>◀</button>
        <div>Pagina <b>{clampedPage}</b> / {pageCount}</div>
        <button onClick={() => setPageNum(p => Math.min(pageCount, p + 1))}>▶</button>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => setScale(s => Math.max(0.6, Math.round((s - 0.1) * 10) / 10))}>−</button>
          <div>Zoom {Math.round(scale * 100)}%</div>
          <button onClick={() => setScale(s => Math.min(2.2, Math.round((s + 0.1) * 10) / 10))}>+</button>
        </div>
      </div>

      <div style={{ overflow: 'auto', background: '#11131a', border: '1px solid #22263a', borderRadius: 12, padding: 8 }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
      </div>
    </div>
  )
}
