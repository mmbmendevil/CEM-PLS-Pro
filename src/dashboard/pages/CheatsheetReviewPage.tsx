import { onAuthStateChanged } from 'firebase/auth'
import { ArrowLeft, FileImage, FileText } from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useBrightness } from '../../contexts/BrightnessContext'
import { useGradingStage } from '@/contexts/GradingStageContext'
import { getStageDiagnosticRecord, resolveStageForSelection } from '../data/learningStage'
import { auth } from '../../lib/firebase'
import { ROUTE_PATHS } from '../../routes/paths'
import { getUserAssessmentProgress, loadReviewerNarrationScript } from '../../services/assessmentProgress'

type ReviewCategory = 'wrong' | 'unseen' | 'correct' | 'other'
type QaItem = {
  question: string
  answer: string
  category: ReviewCategory
}

const toDisplayLine = (line: string) => {
  return line
    .replace(/^#+\s*/, '')
    .replace(/^[-•*]+\s*/, '')
    .replace(/^(highlight|key detail|must know|remember)[:\s-]*/i, '')
    .trim()
}

const stripMarkdownDecorators = (text: string) => text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')

const sentenceCase = (value: string) => {
  const clean = value.trim().replace(/\s+/g, ' ')
  if (!clean) {
    return ''
  }

  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase()
}

const normalizeQuestion = (value: string) => {
  const clean = value
    .replace(/^\d+[.)\-:]\s*/, '')
    .replace(/^(q|question)[:\s-]*/i, '')
    .trim()
    .replace(/\?+$/, '')

  return `${sentenceCase(clean)}?`
}

const normalizeAnswer = (value: string) => {
  const clean = value
    .replace(/^(a|answer)[:\s-]*/i, '')
    .trim()
  if (!clean) {
    return ''
  }

  return clean.charAt(0).toUpperCase() + clean.slice(1)
}

const buildCheatsheetBlocks = (script: string) => {
  return script
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .slice(0, 12)
    .map((block) => {
      const lines = block.split('\n').map((line) => line.trim()).filter(Boolean)
      const first = lines[0] ?? 'Review Block'
      const title = stripMarkdownDecorators(first.replace(/^#+\s*/, '').replace(/^[-•*]+\s*/, '').trim())
      const body = lines.slice(1)

      return {
        title,
        lines: body.length > 0 ? body : lines,
      }
    })
}

const getCategoryFromTitle = (title: string): ReviewCategory => {
  const value = title.toLowerCase()

  if (value.includes('wrong')) {
    return 'wrong'
  }
  if (value.includes('unseen') || value.includes('not shown') || value.includes('unanswered')) {
    return 'unseen'
  }
  if (value.includes('correct')) {
    return 'correct'
  }

  return 'other'
}

const toQaItem = (line: string, category: ReviewCategory): QaItem | null => {
  const clean = stripMarkdownDecorators(toDisplayLine(line))
    .replace(/^[-•*\d.)\s]+/, '')
    .trim()

  if (!clean) {
    return null
  }

  const qIndex = clean.indexOf('?')
  if (qIndex >= 0) {
    const question = normalizeQuestion(clean.slice(0, qIndex + 1))
    const answer = normalizeAnswer(clean.slice(qIndex + 1))
    return { question, answer, category }
  }

  const answerMatch = clean.match(/\s+(?:answer|correct answer)[:\-]?\s+/i)
  if (answerMatch && answerMatch.index !== undefined) {
    const splitIndex = answerMatch.index
    const question = normalizeQuestion(clean.slice(0, splitIndex))
    const answer = normalizeAnswer(clean.slice(splitIndex + answerMatch[0].length))
    return { question, answer, category }
  }

  return {
    question: normalizeQuestion(clean),
    answer: '',
    category,
  }
}

const CheatsheetReviewPage = () => {
  const { isBrightMode } = useBrightness()
  const { selectedStage } = useGradingStage()
  const location = useLocation()
  const exportRef = useRef<HTMLDivElement | null>(null)
  const [uid, setUid] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [reviewerOutput, setReviewerOutput] = useState('')
  const [isReviewUnlocked, setIsReviewUnlocked] = useState(false)
  const [formatLabel, setFormatLabel] = useState('Cheatsheet')
  const [isExportingPng, setIsExportingPng] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    let isCancelled = false

    const loadReviewer = async () => {
      setIsLoading(true)

      if (!uid) {
        if (!isCancelled) {
          setIsLoading(false)
        }
        return
      }

      const assessmentRecords = await getUserAssessmentProgress(uid)

      if (isCancelled) {
        return
      }

      const assessmentMap = new Map(assessmentRecords.map((record) => [record.assessmentKey, record]))
      const activeStage = resolveStageForSelection(assessmentMap, selectedStage)
      const record = getStageDiagnosticRecord(assessmentMap, activeStage)
      const resolvedScript = record
        ? await loadReviewerNarrationScript({
            uid,
            assessmentKey: record.assessmentKey,
            fallbackInline: record.aiReviewerOutput,
            narrationStorage: record.reviewerNarrationStorage,
          })
        : ''

      setReviewerOutput(resolvedScript)
      setIsReviewUnlocked(record?.isReviewUnlocked === true)
      setFormatLabel(record?.reviewerPreference === 'cheatsheet-image' ? 'Cheatsheet Image' : 'Cheatsheet PDF')
      setIsLoading(false)
    }

    void loadReviewer()

    return () => {
      isCancelled = true
    }
  }, [uid, selectedStage])

  const surface = isBrightMode
    ? 'border-cyan-100 bg-linear-to-br from-white via-cyan-50/60 to-slate-50'
    : 'border-cyan-900/40 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.14),_transparent_42%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.12),_transparent_38%),linear-gradient(to_bottom,_#070b12,_#05070d)]'
  const muted = isBrightMode ? 'text-slate-600' : 'text-slate-300'
  const heading = isBrightMode ? 'text-slate-900' : 'text-slate-100'
  const redirectNotice = (location.state as { redirectNotice?: string } | null)?.redirectNotice ?? ''
  const isImageMode = formatLabel === 'Cheatsheet Image'
  const blocks = buildCheatsheetBlocks(reviewerOutput)
  const hasReviewerOutput = reviewerOutput && reviewerOutput !== 'FLASHCARD_READY'

  const qaByCategory = useMemo(() => {
    const grouped: Record<ReviewCategory, QaItem[]> = {
      wrong: [],
      unseen: [],
      correct: [],
      other: [],
    }

    for (const block of blocks) {
      const category = getCategoryFromTitle(block.title)
      if (category === 'other') {
        continue
      }

      for (const line of block.lines) {
        const item = toQaItem(line, category)
        if (item) {
          grouped[category].push(item)
        }
      }
    }

    return grouped
  }, [blocks])

  const notebookTitle = useMemo(() => {
    return formatLabel === 'Cheatsheet PDF' ? 'Printed Study Cheatsheet' : 'Visual Study Cheatsheet'
  }, [formatLabel])

  const exportAsPng = async () => {
    if (!exportRef.current || isExportingPng) {
      return
    }

    setIsExportingPng(true)
    try {
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: '#f9f4e8',
        scale: 2,
        useCORS: true,
      })

      const dataUrl = canvas.toDataURL('image/png')
      const anchor = document.createElement('a')
      anchor.href = dataUrl
      anchor.download = `study-cheatsheet-${Date.now()}.png`
      anchor.click()
    } finally {
      setIsExportingPng(false)
    }
  }

  const exportAsPdf = async () => {
    if (!exportRef.current || isExportingPdf) {
      return
    }

    setIsExportingPdf(true)
    try {
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: '#f9f4e8',
        scale: 2,
        useCORS: true,
      })
      const image = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 8
      const drawWidth = pageWidth - margin * 2
      const drawHeight = (canvas.height * drawWidth) / canvas.width

      if (drawHeight <= pageHeight - margin * 2) {
        pdf.addImage(image, 'PNG', margin, margin, drawWidth, drawHeight)
      } else {
        const fullHeightPx = canvas.height
        const pageInnerHeightMm = pageHeight - margin * 2
        const pageInnerHeightPx = (pageInnerHeightMm * canvas.width) / drawWidth

        let renderedHeightPx = 0
        let pageIndex = 0

        while (renderedHeightPx < fullHeightPx) {
          if (pageIndex > 0) {
            pdf.addPage()
          }

          const sliceCanvas = document.createElement('canvas')
          const sliceHeight = Math.min(pageInnerHeightPx, fullHeightPx - renderedHeightPx)
          sliceCanvas.width = canvas.width
          sliceCanvas.height = sliceHeight

          const ctx = sliceCanvas.getContext('2d')
          if (!ctx) {
            break
          }
          ctx.drawImage(
            canvas,
            0,
            renderedHeightPx,
            canvas.width,
            sliceHeight,
            0,
            0,
            canvas.width,
            sliceHeight,
          )

          const sliceData = sliceCanvas.toDataURL('image/png')
          const sliceHeightMm = (sliceHeight * drawWidth) / canvas.width
          pdf.addImage(sliceData, 'PNG', margin, margin, drawWidth, sliceHeightMm)

          renderedHeightPx += sliceHeight
          pageIndex += 1
        }
      }

      pdf.save(`study-cheatsheet-${Date.now()}.pdf`)
    } finally {
      setIsExportingPdf(false)
    }
  }

  if (isLoading) {
    return <section className={`rounded-3xl border p-10 text-lg ${surface}`}>Loading cheatsheet review...</section>
  }

  if (!isReviewUnlocked) {
    return (
      <section className={`rounded-3xl border p-10 md:p-12 ${surface}`}>
        {redirectNotice ? (
          <div className={`mb-6 rounded-2xl border px-5 py-4 text-base ${isBrightMode ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-sky-900/40 bg-sky-950/30 text-sky-300'}`}>
            {redirectNotice}
          </div>
        ) : null}
        <h1 className={`text-4xl font-black tracking-tight ${heading}`}>Cheatsheet Review is locked</h1>
        <p className={`mt-4 max-w-2xl text-lg ${muted}`}>
          Go to Personalized Study Plan, choose a format, and create a reviewer first.
        </p>
        <Link
          to={ROUTE_PATHS.dashboard.studyPlan}
          className={`mt-8 inline-flex h-14 items-center gap-2 rounded-xl px-8 text-xs font-black uppercase tracking-widest text-white transition-colors ${isBrightMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
        >
          Back to Reviewer Maker
          <ArrowLeft size={16} />
        </Link>
      </section>
    )
  }

  return (
    <section className={`relative overflow-hidden rounded-3xl border p-10 md:p-12 ${surface}`}>
      <div className="relative max-w-5xl mx-auto space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className={`text-xs font-black uppercase tracking-[0.3em] ${isBrightMode ? 'text-cyan-700' : 'text-cyan-300'}`}>Cheatsheet Review</p>
            <h1 className={`mt-2 text-4xl md:text-5xl font-black ${heading}`}>Study Cheatsheet</h1>
            <p className={`mt-2 ${muted}`}>Format: {formatLabel}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {hasReviewerOutput ? (
              <>
                <button
                  type="button"
                  onClick={() => void exportAsPng()}
                  className={`inline-flex h-11 items-center gap-2 rounded-xl px-4 text-xs font-black uppercase tracking-wider transition-colors ${isBrightMode ? 'bg-amber-100 text-amber-900 hover:bg-amber-200' : 'bg-amber-900/30 text-amber-200 hover:bg-amber-900/50'}`}
                  disabled={isExportingPng}
                >
                  <FileImage size={14} />
                  {isExportingPng ? 'Exporting PNG...' : 'Download PNG'}
                </button>

                <button
                  type="button"
                  onClick={() => void exportAsPdf()}
                  className={`inline-flex h-11 items-center gap-2 rounded-xl px-4 text-xs font-black uppercase tracking-wider transition-colors ${isBrightMode ? 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200' : 'bg-emerald-900/30 text-emerald-200 hover:bg-emerald-900/50'}`}
                  disabled={isExportingPdf}
                >
                  <FileText size={14} />
                  {isExportingPdf ? 'Exporting PDF...' : 'Download PDF'}
                </button>
              </>
            ) : null}

            <Link
              to={ROUTE_PATHS.dashboard.studyPlan}
              className={`inline-flex h-11 items-center gap-2 rounded-xl px-5 text-xs font-black uppercase tracking-wider ${isBrightMode ? 'bg-slate-100 text-slate-800 hover:bg-slate-200' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}
            >
              <ArrowLeft size={14} />
              Back to Plan
            </Link>
          </div>
        </div>

        <div className={`rounded-3xl border p-6 md:p-8 ${isBrightMode ? 'border-cyan-100 bg-white/90' : 'border-cyan-800/30 bg-[#0b1320]/65'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isBrightMode ? 'bg-cyan-50 text-cyan-700' : 'bg-cyan-900/30 text-cyan-200'}`}>
              {isImageMode ? <FileImage size={18} /> : <FileText size={18} />}
            </div>
            <div>
              <p className={`text-xs font-black uppercase tracking-[0.25em] ${muted}`}>AI Output</p>
              <p className={`text-sm font-semibold ${heading}`}>Cheatsheet content</p>
            </div>
          </div>

          {hasReviewerOutput ? (
            isImageMode ? (
              <div className="space-y-4">
                <div
                  ref={exportRef}
                  className="rounded-3xl border border-amber-200 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.72),rgba(255,255,255,0.72)),repeating-linear-gradient(to_bottom,#f6f0df_0px,#f6f0df_30px,#d8d3c6_31px)] p-6 md:p-8 shadow-[0_18px_45px_rgba(77,55,24,0.18)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-amber-700">Handwritten Study Sheet</p>
                      <h3 className="mt-2 text-3xl font-black tracking-tight text-amber-950 font-['Segoe_Print','Bradley_Hand','Comic_Sans_MS',cursive]">
                        {notebookTitle}
                      </h3>
                      <p className="mt-2 text-sm text-amber-900/90">Wrong answers first, then unseen topics, then correct-answer reinforcement.</p>
                    </div>
                    <div className="max-w-55 -rotate-2 rounded-lg border border-amber-300 bg-yellow-200/80 px-3 py-2 text-[11px] font-semibold leading-snug text-amber-900 shadow-md font-['Segoe_Print','Bradley_Hand','Comic_Sans_MS',cursive]">
                      Tip: Use color coding while reviewing. One purpose per color helps recall faster.
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {([
                      ['wrong', 'wrong answers', 'border-red-200 bg-red-50/80', 'text-red-800'],
                      ['unseen', 'unseen questions', 'border-yellow-300 bg-yellow-50/90', 'text-yellow-800'],
                      ['correct', 'correct answers', 'border-emerald-200 bg-emerald-50/85', 'text-emerald-800'],
                    ] as const).map(([categoryKey, label, sectionClass, titleClass]) => (
                      <div key={categoryKey} className={`rounded-xl border px-3.5 py-3.5 ${sectionClass}`}>
                        <h4 className={`text-sm font-black tracking-wide font-['Segoe_Print','Bradley_Hand','Comic_Sans_MS',cursive] ${titleClass}`}>
                          {label}
                        </h4>
                        <div className="mt-2 space-y-1.5">
                          {qaByCategory[categoryKey].length > 0 ? (
                            qaByCategory[categoryKey].map((item, index) => (
                              <p key={`${categoryKey}-${index}`} className="text-sm leading-6 text-slate-800 text-left">
                                {item.question}{' '}
                                {item.answer ? <strong className="font-extrabold text-slate-900">{item.answer}</strong> : null}
                              </p>
                            ))
                          ) : (
                            <p className="text-sm leading-6 text-slate-700">No items yet.</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                    <div className="mt-4 rounded-xl border border-amber-200 bg-white/80 px-3 py-2 text-[11px] text-amber-900/85">
                    <p className="font-bold uppercase tracking-[0.2em]">Color key</p>
                    <p className="mt-1">
                      Wrong answers: light red | Unseen questions: yellow | Correct answers: green
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div
                ref={exportRef}
                className="rounded-3xl border border-amber-200 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.74),rgba(255,255,255,0.74)),repeating-linear-gradient(to_bottom,#f7f1e2_0px,#f7f1e2_30px,#d9d3c8_31px)] p-5 md:p-6 shadow-[0_14px_36px_rgba(77,55,24,0.15)]"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-700">Printable Study Sheet</p>
                <h3 className="mt-1.5 text-2xl font-black text-amber-950 font-['Segoe_Print','Bradley_Hand','Comic_Sans_MS',cursive]">{notebookTitle}</h3>
                <div className="mt-3 space-y-3 text-sm leading-6 font-medium text-slate-800 font-['Trebuchet_MS','Calibri',sans-serif]">
                  {([
                    ['wrong', 'wrong answers', 'border-red-200 bg-red-50/80', 'text-red-800'],
                    ['unseen', 'unseen questions', 'border-yellow-300 bg-yellow-50/90', 'text-yellow-800'],
                    ['correct', 'correct answers', 'border-emerald-200 bg-emerald-50/85', 'text-emerald-800'],
                  ] as const).map(([categoryKey, label, sectionClass, titleClass]) => (
                    <div key={`${categoryKey}-pdf`} className={`space-y-1.5 rounded-xl border px-3 py-2 ${sectionClass}`}>
                      <h4 className={`text-sm font-black tracking-wide ${titleClass}`}>{label}</h4>
                      <div className="space-y-1">
                        {qaByCategory[categoryKey].length > 0 ? (
                          qaByCategory[categoryKey].map((item, index) => (
                            <p key={`${categoryKey}-pdf-${index}`} className="leading-6 text-slate-800 text-left">
                              {item.question}{' '}
                              {item.answer ? <strong className="font-extrabold text-slate-900">{item.answer}</strong> : null}
                            </p>
                          ))
                        ) : (
                          <p className="leading-6 text-slate-700">No items yet.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ) : (
            <div className={`rounded-2xl border p-4 ${isBrightMode ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-slate-700 bg-slate-900/40 text-slate-300'}`}>
              Cheatsheet reviewer content is not available yet.
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <Link
              to={ROUTE_PATHS.dashboard.postTest}
              className={`inline-flex h-12 items-center gap-2 rounded-xl px-6 text-xs font-black uppercase tracking-widest text-white transition-colors ${isBrightMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              Answer Post-Test
              <ArrowLeft size={16} className="rotate-180" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CheatsheetReviewPage
