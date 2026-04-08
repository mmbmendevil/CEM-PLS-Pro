import { onAuthStateChanged } from 'firebase/auth'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Lock,
  Maximize,
  Pause,
  Play,
  Settings,
  SkipBack,
  SkipForward,
  Volume2,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useBrightness } from '../../contexts/BrightnessContext'
import { useGradingStage } from '@/contexts/GradingStageContext'
import { getStageDiagnosticRecord, resolveStageForSelection } from '../data/learningStage'
import { auth } from '../../lib/firebase'
import { ROUTE_PATHS } from '../../routes/paths'
import { getUserAssessmentProgress, loadReviewerNarrationScript } from '../../services/assessmentProgress'

type AudiobookChapter = {
  id: number
  title: string
  duration: string
  content: string
}

const stripMarkdownForSpeech = (value: string) => {
  return value
    .replace(/^#+\s*/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .trim()
}

const estimateDuration = (content: string) => {
  const wordCount = content.split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.ceil(wordCount / 140))
  return `${minutes}:00`
}

const pickPreferredVoice = (voices: SpeechSynthesisVoice[]) => {
  const preferredNames = ['Aria', 'Jenny', 'Sonia', 'Google US English', 'Samantha', 'Zira', 'David']

  for (const name of preferredNames) {
    const match = voices.find((voice) => voice.name.toLowerCase().includes(name.toLowerCase()))
    if (match) {
      return match
    }
  }

  return voices.find((voice) => voice.lang.toLowerCase().startsWith('en')) ?? voices[0]
}

const buildChaptersFromScript = (script: string): AudiobookChapter[] => {
  const trimmed = script.trim()
  if (!trimmed) {
    return []
  }

  const blocks = trimmed
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)

  const chapters = blocks.slice(0, 12).map((block, index) => {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean)
    const firstLine = lines[0] ?? `Chapter ${index + 1}`
    const normalizedTitle = firstLine.replace(/^#+\s*/, '').trim()
    const fallbackTitle = `Chapter ${index + 1}`
    const title = normalizedTitle.length > 0 ? normalizedTitle : fallbackTitle
    const duration = estimateDuration(block)

    const lowered = block.toLowerCase()
    let priority = 3

    if (/wrong|incorrect|mistake|unanswered/.test(lowered)) {
      priority = 0
    } else if (/unseen|not shown|not included|not appear/.test(lowered)) {
      priority = 1
    } else if (/correct|reinforcement|mastered/.test(lowered)) {
      priority = 2
    }

    return {
      id: index + 1,
      title,
      duration,
      content: block,
      priority,
    }
  })

  const ordered = chapters
    .sort((first, second) => first.priority - second.priority)
    .map(({ title, duration, content }, index) => ({
      id: index + 1,
      title,
      duration,
      content,
    }))

  return ordered
}

const AudiobookReviewPage = () => {
  const { isBrightMode } = useBrightness()
  const { selectedStage } = useGradingStage()
  const location = useLocation()
  const [uid, setUid] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [reviewerOutput, setReviewerOutput] = useState('')
  const [isReviewUnlocked, setIsReviewUnlocked] = useState(false)
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('')
  const [speechRate, setSpeechRate] = useState(0.92)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

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
  const chapters = useMemo(() => buildChaptersFromScript(reviewerOutput), [reviewerOutput])
  const hasScript = reviewerOutput && reviewerOutput !== 'FLASHCARD_READY'

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return
    }

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices()
      setAvailableVoices(voices)

      if (!selectedVoiceURI && voices.length > 0) {
        const preferred = pickPreferredVoice(voices)
        setSelectedVoiceURI(preferred?.voiceURI ?? '')
      }
    }

    updateVoices()
    window.speechSynthesis.onvoiceschanged = updateVoices

    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [selectedVoiceURI])

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  useEffect(() => {
    if (chapters.length === 0) {
      setCurrentChapterIndex(0)
      return
    }

    if (currentChapterIndex >= chapters.length) {
      setCurrentChapterIndex(0)
    }
  }, [chapters, currentChapterIndex])

  const currentChapter = chapters[currentChapterIndex]

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return
    }

    window.speechSynthesis.cancel()
    utteranceRef.current = null

    if (!isPlaying || !currentChapter) {
      return
    }

    const utterance = new SpeechSynthesisUtterance(stripMarkdownForSpeech(currentChapter.content))
    const selectedVoice = availableVoices.find((voice) => voice.voiceURI === selectedVoiceURI)

    if (selectedVoice) {
      utterance.voice = selectedVoice
      utterance.lang = selectedVoice.lang
    }

    utterance.rate = speechRate
    utterance.pitch = 1
    utterance.volume = 1
    utterance.onend = () => {
      setCurrentChapterIndex((index) => {
        if (index < chapters.length - 1) {
          return index + 1
        }

        setIsPlaying(false)
        return index
      })
    }

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)

    return () => {
      window.speechSynthesis.cancel()
      utteranceRef.current = null
    }
  }, [availableVoices, selectedVoiceURI, speechRate, isPlaying, currentChapter, chapters.length])

  const progressPercent = chapters.length > 0 ? Math.round(((currentChapterIndex + 1) / chapters.length) * 100) : 0
  const mediaProgressPercent = chapters.length > 0
    ? Math.min(100, Math.round((currentChapterIndex / chapters.length) * 100 + (isPlaying ? 10 : 0)))
    : 0

  const canGoPrevious = currentChapterIndex > 0
  const canGoNext = currentChapterIndex < chapters.length - 1

  const handlePreviousChapter = () => {
    setCurrentChapterIndex((index) => Math.max(0, index - 1))
  }

  const handleNextChapter = () => {
    setCurrentChapterIndex((index) => Math.min(chapters.length - 1, index + 1))
  }

  if (isLoading) {
    return <section className={`rounded-3xl border p-10 text-lg ${surface}`}>Loading audiobook review...</section>
  }

  if (!isReviewUnlocked) {
    return (
      <section className={`rounded-3xl border p-10 md:p-12 ${surface}`}>
        {redirectNotice ? (
          <div className={`mb-6 rounded-2xl border px-5 py-4 text-base ${isBrightMode ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-sky-900/40 bg-sky-950/30 text-sky-300'}`}>
            {redirectNotice}
          </div>
        ) : null}
        <h1 className={`text-4xl font-black tracking-tight ${heading}`}>Audiobook Review is locked</h1>
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
    <section className={`relative overflow-hidden rounded-3xl border p-6 md:p-10 ${surface}`}>
      <div className="relative max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-4 text-slate-500">
          <Link
            to={ROUTE_PATHS.dashboard.studyPlan}
            className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${isBrightMode ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex flex-col">
            <span className={`text-[10px] font-black uppercase tracking-widest ${isBrightMode ? 'text-cyan-700' : 'text-cyan-300'}`}>Audiobook Review</span>
            <h2 className={`text-2xl font-black italic tracking-tighter uppercase ${heading}`}>Narration Script Player</h2>
          </div>
        </div>

        <div className={`rounded-xl border px-4 py-3 flex flex-col md:flex-row md:items-center gap-3 ${isBrightMode ? 'border-cyan-200 bg-cyan-50/70 text-cyan-800' : 'border-cyan-800/60 bg-cyan-900/20 text-cyan-200'}`}>
          <span className="text-xs font-black uppercase tracking-widest">Narration Voice</span>
          <select
            value={selectedVoiceURI}
            onChange={(event) => setSelectedVoiceURI(event.target.value)}
            className={`rounded-lg border px-3 py-1.5 text-sm outline-none ${isBrightMode ? 'border-cyan-300 bg-white text-slate-900' : 'border-cyan-700 bg-[#0b1320] text-slate-100'}`}
          >
            {availableVoices.map((voice) => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2 md:ml-auto">
            <span className="text-xs font-black uppercase tracking-widest">Speed</span>
            <button
              type="button"
              onClick={() => setSpeechRate((value) => Math.max(0.75, Number((value - 0.05).toFixed(2))))}
              className={`h-8 w-8 rounded-md font-black ${isBrightMode ? 'bg-white border border-cyan-300 text-cyan-700' : 'bg-[#0b1320] border border-cyan-700 text-cyan-200'}`}
            >
              -
            </button>
            <span className="text-sm font-black min-w-10 text-center">{speechRate.toFixed(2)}x</span>
            <button
              type="button"
              onClick={() => setSpeechRate((value) => Math.min(1.2, Number((value + 0.05).toFixed(2))))}
              className={`h-8 w-8 rounded-md font-black ${isBrightMode ? 'bg-white border border-cyan-300 text-cyan-700' : 'bg-[#0b1320] border border-cyan-700 text-cyan-200'}`}
            >
              +
            </button>
          </div>
        </div>

        {hasScript ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              <div className={`relative aspect-video rounded-[2.5rem] overflow-hidden border group shadow-2xl ${isBrightMode ? 'bg-white border-slate-200 shadow-cyan-600/10' : 'bg-[#0A0A0A] border-white/5 shadow-blue-600/5'}`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-4 px-6">
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setIsPlaying((current) => !current)}
                      className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/40"
                    >
                      {isPlaying ? <Pause fill="white" /> : <Play fill="white" className="ml-1" />}
                    </motion.button>
                    <p className={`text-xs font-bold uppercase tracking-widest ${isBrightMode ? 'text-slate-600' : 'text-slate-500'}`}>
                      Currently Viewing: {currentChapter?.title ?? 'No chapter selected'}
                    </p>
                  </div>
                </div>

                <div className="absolute bottom-0 inset-x-0 p-6 md:p-8 bg-linear-to-t from-black/80 to-transparent">
                  <div className="space-y-4">
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.5)]" style={{ width: `${mediaProgressPercent}%` }} />
                    </div>

                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center gap-4 md:gap-6">
                        <button type="button" onClick={handlePreviousChapter} disabled={!canGoPrevious} className="disabled:opacity-40">
                          <SkipBack size={20} className="hover:text-blue-500" />
                        </button>
                        <button type="button" onClick={handleNextChapter} disabled={!canGoNext} className="disabled:opacity-40">
                          <SkipForward size={20} className="hover:text-blue-500" />
                        </button>
                        <Volume2 size={20} className="hover:text-blue-500" />
                        <span className="text-xs font-mono text-slate-300">
                          {`${currentChapter?.duration ?? '0:00'} / ${(chapters.length * 3).toString()}:00`}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 md:gap-6">
                        <Settings size={20} className="hover:text-blue-500" />
                        <Maximize size={20} className="hover:text-blue-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`border rounded-4xl p-8 ${isBrightMode ? 'bg-white border-slate-200' : 'bg-[#0A0A0A] border-white/5'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${isBrightMode ? 'bg-blue-50 text-blue-600' : 'bg-blue-600/10 text-blue-400'}`}>
                    Computer Architecture
                  </span>
                  <span className={`text-xs font-bold uppercase ${isBrightMode ? 'text-slate-500' : 'text-slate-500'}`}>AI Narrator</span>
                </div>
                <p className={`text-sm md:text-base leading-relaxed whitespace-pre-wrap ${muted}`}>
                  {currentChapter?.content ?? 'No chapter content available.'}
                </p>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="bg-blue-600 rounded-4xl p-8 text-white relative overflow-hidden shadow-lg shadow-blue-600/20">
                <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Overall Progress</p>
                  <h3 className="text-4xl font-black italic tracking-tighter mb-4">{progressPercent}%</h3>
                  <div className="h-2 w-full bg-black/20 rounded-full">
                    <div className="h-full bg-white rounded-full shadow-md transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>
                <div className="absolute top-[-20%] right-[-10%] opacity-20 rotate-12">
                  <BookOpen size={140} />
                </div>
              </div>

              <div className={`border rounded-4xl p-6 h-fit ${isBrightMode ? 'bg-white border-slate-200' : 'bg-[#0A0A0A] border-white/5'}`}>
                <div className="flex items-center gap-2 mb-8 px-2">
                  <motion.div animate={{ rotate: [0, 15, 0] }} transition={{ repeat: Infinity, duration: 4 }}>
                    <Clock className={isBrightMode ? 'text-blue-600' : 'text-blue-500'} size={18} />
                  </motion.div>
                  <h3 className={`text-[10px] font-black uppercase tracking-widest ${isBrightMode ? 'text-slate-500' : 'text-slate-500'}`}>Course Curriculum</h3>
                </div>

                <div className="space-y-2">
                  {chapters.map((chapter, index) => {
                    const isActive = index === currentChapterIndex
                    const isCompleted = index < currentChapterIndex
                    const isLocked = index > currentChapterIndex + 2

                    return (
                        <button
                          key={chapter.id}
                          type="button"
                          disabled={isLocked}
                          onClick={() => {
                            setCurrentChapterIndex(index)
                          }}
                        className={`w-full text-left p-4 rounded-2xl transition-all flex items-center justify-between group ${isActive ? isBrightMode ? 'bg-blue-50 border border-blue-200' : 'bg-blue-600/10 border border-blue-500/30' : isBrightMode ? 'hover:bg-slate-50 border border-transparent' : 'hover:bg-white/5 border border-transparent'} ${isLocked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <div className="flex items-center gap-4">
                          {isCompleted ? (
                            <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />
                          ) : isLocked ? (
                            <Lock className="text-slate-600 shrink-0" size={18} />
                          ) : (
                            <div className={`h-2 w-2 rounded-full shrink-0 ${isActive ? 'bg-blue-500 animate-pulse' : isBrightMode ? 'bg-slate-300' : 'bg-slate-700'}`} />
                          )}

                          <div className="flex flex-col">
                            <span className={`text-sm font-bold tracking-tight ${isActive ? isBrightMode ? 'text-blue-600' : 'text-blue-400' : isBrightMode ? 'text-slate-700' : 'text-slate-300'}`}>
                              {chapter.title}
                            </span>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${isBrightMode ? 'text-slate-500' : 'text-slate-600'}`}>
                              {chapter.duration}
                            </span>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={`rounded-3xl border p-6 md:p-8 ${isBrightMode ? 'border-cyan-100 bg-white/90' : 'border-cyan-800/30 bg-[#0b1320]/65'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isBrightMode ? 'bg-cyan-50 text-cyan-700' : 'bg-cyan-900/30 text-cyan-200'}`}>
                <Volume2 size={18} />
              </div>
              <div>
                <p className={`text-xs font-black uppercase tracking-[0.25em] ${muted}`}>AI Output</p>
                <p className={`text-sm font-semibold ${heading}`}>Audiobook script content</p>
              </div>
            </div>

            <div className={`rounded-2xl border p-4 ${isBrightMode ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-slate-700 bg-slate-900/40 text-slate-300'}`}>
              Audiobook reviewer content is not available yet.
            </div>
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
    </section>
  )
}

export default AudiobookReviewPage
