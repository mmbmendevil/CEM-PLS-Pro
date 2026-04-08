import { onAuthStateChanged } from 'firebase/auth'
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, List } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useBrightness } from '../../contexts/BrightnessContext'
import { MODULES_CATALOG, type ModuleCatalogItem } from '../data/modulesCatalog'
import { auth } from '../../lib/firebase'
import { ROUTE_PATHS } from '../../routes/paths'
import { getModuleProgress, upsertModuleProgress } from '../../services/moduleProgress'

type ModuleViewerState = {
  moduleId?: number
  progress?: number
}

const ModuleViewerPage = () => {
  const { isBrightMode } = useBrightness()
  const [hasVideoError, setHasVideoError] = useState(false)
  const [videoProgress, setVideoProgress] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isCompletionLocked, setIsCompletionLocked] = useState(false)
  const [uid, setUid] = useState<string | null>(null)
  const [isHydratingProgress, setIsHydratingProgress] = useState(true)
  const articleRef = useRef<HTMLElement | null>(null)
  const lessonSectionRef = useRef<HTMLElement | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const viewerState = (location.state as ModuleViewerState | null) ?? null
  const resolvedModuleId = viewerState?.moduleId ?? 1
  const resolvedModule: ModuleCatalogItem = MODULES_CATALOG.find((module) => module.id === resolvedModuleId) ?? MODULES_CATALOG[0]
  const resolvedVideoSrc = encodeURI(resolvedModule.video.src)
  const progress = isCompletionLocked ? 100 : Math.round(videoProgress * 0.8 + scrollProgress * 0.2)
  const isModuleFullyComplete = isCompletionLocked || progress >= 100
  const isPrelimFinalModule = resolvedModule.id >= 3
  const lessonContent = resolvedModule.lessonContent ?? resolvedModule.description

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    let isCancelled = false

    const hydrateSavedProgress = async () => {
      setIsHydratingProgress(true)

      if (!uid) {
        if (!isCancelled) {
          setIsHydratingProgress(false)
        }
        return
      }

      const record = await getModuleProgress(uid, resolvedModule.id)

      if (!record || isCancelled) {
        if (!isCancelled) {
          setIsHydratingProgress(false)
        }
        return
      }

      const isPersistedComplete = record.isCompleted === true || (record.overallProgress ?? 0) >= 100

      setIsCompletionLocked(isPersistedComplete)
      setVideoProgress(isPersistedComplete ? 100 : record.videoProgress ?? 0)
      setScrollProgress(isPersistedComplete ? 100 : record.scrollProgress ?? 0)
      setIsHydratingProgress(false)
    }

    void hydrateSavedProgress()

    return () => {
      isCancelled = true
    }
  }, [uid, resolvedModule.id])

  useEffect(() => {
    if (!uid || isHydratingProgress) {
      return
    }

    const timer = window.setTimeout(() => {
      const nextProgress = isCompletionLocked ? 100 : progress

      void upsertModuleProgress({
        uid,
        moduleId: resolvedModule.id,
        videoProgress: isCompletionLocked ? 100 : videoProgress,
        scrollProgress: isCompletionLocked ? 100 : scrollProgress,
        overallProgress: nextProgress,
        isCompleted: nextProgress >= 100,
      })
    }, 350)

    return () => {
      window.clearTimeout(timer)
    }
  }, [uid, resolvedModule.id, videoProgress, scrollProgress, progress, isHydratingProgress, isCompletionLocked])

  const handleAdvanceModule = async () => {
    if (uid) {
      const normalizedOverallProgress = isCompletionLocked || isModuleFullyComplete || isPrelimFinalModule ? 100 : progress

      await upsertModuleProgress({
        uid,
        moduleId: resolvedModule.id,
        videoProgress: normalizedOverallProgress >= 100 ? 100 : videoProgress,
        scrollProgress: normalizedOverallProgress >= 100 ? 100 : scrollProgress,
        overallProgress: normalizedOverallProgress,
        isCompleted: normalizedOverallProgress >= 100,
      })
    }

    navigate(ROUTE_PATHS.dashboard.modules)
  }

  useEffect(() => {
    setHasVideoError(false)
    setVideoProgress(0)
    setScrollProgress(0)
    setIsCompletionLocked(false)
    setIsHydratingProgress(true)
  }, [resolvedVideoSrc])

  useEffect(() => {
    if (isCompletionLocked) {
      return
    }

    const computeScrollProgress = () => {
      const lessonSection = lessonSectionRef.current

      if (!lessonSection) {
        return
      }

      const pageBottom = window.scrollY + window.innerHeight
      const maxPageScroll = document.documentElement.scrollHeight

      if (pageBottom >= maxPageScroll - 2) {
        setScrollProgress(100)
        return
      }

      const rect = lessonSection.getBoundingClientRect()
      const sectionTop = window.scrollY + rect.top
      const sectionBottom = sectionTop + lessonSection.scrollHeight
      const start = sectionTop - window.innerHeight * 0.6
      const end = sectionBottom - window.innerHeight * 0.4
      const range = end - start

      if (range <= 0) {
        setScrollProgress(0)
        return
      }

      const ratio = (window.scrollY - start) / range
      const clamped = Math.min(1, Math.max(0, ratio))
      setScrollProgress(Math.round(clamped * 100))
    }

    computeScrollProgress()
    window.addEventListener('scroll', computeScrollProgress, { passive: true })
    window.addEventListener('resize', computeScrollProgress)

    return () => {
      window.removeEventListener('scroll', computeScrollProgress)
      window.removeEventListener('resize', computeScrollProgress)
    }
  }, [resolvedModule.id, lessonContent, isCompletionLocked])

  const pageClass = isBrightMode
    ? 'bg-[#FDFCFB] text-slate-900'
    : 'bg-[radial-gradient(circle_at_center,#0b1220_0%,#0f172a_42%,#1e293b_100%)] text-white'
  const panelClass = isBrightMode
    ? 'bg-white border-slate-100/80'
    : 'bg-gradient-to-br from-[#0f172a]/80 via-[#111827]/70 to-[#1e293b]/45 border-slate-700/50 backdrop-blur-xl'
  const mutedText = isBrightMode ? 'text-slate-500' : 'text-slate-400'

  return (
    <div className={`min-h-screen font-sans selection:bg-blue-500/30 ${pageClass}`}>
      {!isBrightMode ? (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-80">
          <div className="absolute top-1/2 left-1/2 h-144 w-xl -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0b1220]/75 blur-[130px]" />
          <div className="absolute -inset-24 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0)_34%,rgba(30,41,59,0.30)_78%,rgba(51,65,85,0.45)_100%)] blur-3xl" />
        </div>
      ) : null}

      <header
        className={`sticky top-20 z-30 backdrop-blur-2xl border-b ${
          isBrightMode ? 'bg-[#FDFCFB]/80 border-slate-200/50' : 'bg-[#0f172a]/75 border-slate-700/60'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link
            to={ROUTE_PATHS.dashboard.modules}
            className={`flex items-center gap-3 transition-colors group ${
              isBrightMode ? 'text-slate-400 hover:text-slate-900' : 'text-slate-500 hover:text-white'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center group-hover:transition-colors shadow-sm ${
                isBrightMode ? 'bg-slate-100 group-hover:bg-slate-200' : 'bg-slate-900 group-hover:bg-slate-800'
              }`}
            >
              <ArrowLeft size={16} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] hidden sm:block">Exit</span>
          </Link>

          <div className="flex-1 text-center px-4 overflow-hidden">
            <h1 className={`text-[10px] font-black uppercase tracking-[0.2em] truncate opacity-80 ${isBrightMode ? 'text-slate-800' : 'text-slate-200'}`}>
              {resolvedModule.title}
            </h1>
          </div>

          <div className="flex items-center gap-4 w-10 justify-end">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">{progress}%</span>
          </div>
        </div>

        <div className={`absolute bottom-0 left-0 h-0.5 w-full ${isBrightMode ? 'bg-slate-100' : 'bg-slate-900'}`}>
          <div className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-[1.5s]" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 sm:px-8 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-12 relative z-10">
        <div className="max-w-210 justify-self-center lg:justify-self-end w-full">
          <article
            ref={articleRef}
            className={`rounded-[3.5rem] sm:rounded-[4rem] p-8 sm:p-14 md:p-20 shadow-sm border relative z-10 backdrop-blur-2xl ${panelClass} ${
              isBrightMode ? '' : '[clip-path:polygon(0_0,100%_0,100%_90%,90%_100%,0_100%)]'
            }`}
          >
            <header className="mb-20 text-center space-y-8">
              <div className={`inline-flex items-center justify-center h-8 px-4 rounded-full border ${isBrightMode ? 'bg-slate-50 border-slate-100' : 'bg-slate-900 border-slate-800'}`}>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
                  Module {resolvedModule.id} of {MODULES_CATALOG.length}
                </span>
              </div>
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 border ${isBrightMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700'}`}>
                <span className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">Competency</span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${isBrightMode ? 'text-slate-900' : 'text-white'}`}>
                  {resolvedModule.competencyCode}
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1]">{resolvedModule.title}</h1>
              <p className={`text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed ${mutedText}`}>{resolvedModule.description}</p>
            </header>

            <div className="space-y-12">
              <section id="text" ref={lessonSectionRef}>
                <h3 className={`text-sm font-black uppercase tracking-[0.2em] mb-4 ${isBrightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Lesson Notes
                </h3>
                <p className={`leading-relaxed text-base whitespace-pre-line ${isBrightMode ? 'text-slate-700' : 'text-slate-300'}`}>
                  {lessonContent}
                </p>
              </section>

              <section id="video">
                <h2 className="text-2xl font-black mb-6 flex items-center gap-2 italic uppercase tracking-tight">
                  <span className="w-8 h-0.5 bg-blue-600 inline-block" />
                  Video Lecture
                </h2>
                <div
                  className={`relative w-full min-h-112 md:min-h-136 lg:min-h-152 rounded-3xl overflow-hidden shadow-2xl border ${
                    isBrightMode
                      ? 'border-slate-200 bg-linear-to-br from-slate-100 to-slate-200'
                      : 'border-slate-700 bg-linear-to-br from-[#0f172a] via-[#111827] to-[#020617]'
                  }`}
                >
                  <video
                    key={resolvedVideoSrc}
                    className="absolute inset-0 w-full h-full object-contain bg-black"
                    controls
                    preload="metadata"
                    src={resolvedVideoSrc}
                    onLoadedMetadata={(event) => {
                      if (isCompletionLocked) {
                        return
                      }

                      const duration = event.currentTarget.duration
                      const currentTime = event.currentTarget.currentTime

                      if (!duration || Number.isNaN(duration)) {
                        setVideoProgress(0)
                        return
                      }

                      setVideoProgress(Math.round((currentTime / duration) * 100))
                    }}
                    onTimeUpdate={(event) => {
                      if (isCompletionLocked) {
                        return
                      }

                      const duration = event.currentTarget.duration
                      const currentTime = event.currentTarget.currentTime

                      if (!duration || Number.isNaN(duration)) {
                        setVideoProgress(0)
                        return
                      }

                      setVideoProgress(Math.round((currentTime / duration) * 100))
                    }}
                    onEnded={() => setVideoProgress(100)}
                    onError={() => setHasVideoError(true)}
                  >
                    Your browser does not support the video tag.
                  </video>
                  {hasVideoError ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 px-6 text-center">
                      <p className="text-xs font-bold uppercase tracking-wider text-rose-300">
                        Failed to load video source: {resolvedVideoSrc}
                      </p>
                    </div>
                  ) : null}
                </div>
              </section>
            </div>
          </article>

          <div className="mt-12 md:mt-16 flex flex-col sm:flex-row items-center justify-between gap-4 px-4">
            <button
              disabled
              className={`w-full sm:w-auto flex-1 sm:max-w-60 flex items-center justify-center gap-3 h-16 rounded-full border font-black uppercase tracking-[0.2em] text-[10px] cursor-not-allowed opacity-50 ${
                isBrightMode ? 'border-slate-200 text-slate-300' : 'border-slate-800 text-slate-600'
              }`}
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>

            <button
              onClick={handleAdvanceModule}
              className={`w-full sm:w-auto flex-1 sm:max-w-60 flex items-center justify-center gap-3 h-16 rounded-full font-black uppercase tracking-[0.2em] text-sm transition-all shadow-xl group relative overflow-hidden hover:-translate-y-0.5 border ${
                isPrelimFinalModule || isModuleFullyComplete
                  ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/30 hover:bg-blue-700'
                  : isBrightMode
                    ? 'bg-white text-slate-900 border-slate-200 shadow-slate-200/60 hover:bg-slate-50'
                    : 'bg-white text-slate-900 border-white shadow-white/20 hover:bg-slate-100'
              }`}
            >
              <span className="relative z-10">{isPrelimFinalModule ? 'Finish' : isModuleFullyComplete ? 'Next' : 'Skip'}</span>
              <ChevronRight size={16} className="relative z-10" />
            </button>
          </div>
        </div>

        <aside className="hidden lg:block self-start sticky top-44 h-fit">
          <div className="space-y-8">
            <div
              className={`backdrop-blur-xl rounded-4xl border p-8 shadow-sm ${
                isBrightMode ? 'bg-white/50 border-slate-100' : 'bg-[#0f172a]/60 border-slate-700/60'
              }`}
            >
              <div className="flex items-center gap-3 mb-6">
                <List size={16} className="text-blue-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Chapters</span>
              </div>
              <nav className="space-y-4">
                <a
                  href="#text"
                  className="group flex items-center gap-4 text-[11px] font-black text-slate-400 hover:text-blue-500 transition-all uppercase tracking-widest leading-tight"
                >
                  <span className={`w-1.5 h-1.5 rounded-full transition-colors ${isBrightMode ? 'bg-slate-200 group-hover:bg-blue-500' : 'bg-slate-800 group-hover:bg-blue-500'}`} />
                  Lesson Notes
                </a>
                <a
                  href="#video"
                  className="group flex items-center gap-4 text-[11px] font-black text-slate-400 hover:text-blue-500 transition-all uppercase tracking-widest leading-tight"
                >
                  <span className={`w-1.5 h-1.5 rounded-full transition-colors ${isBrightMode ? 'bg-slate-200 group-hover:bg-blue-500' : 'bg-slate-800 group-hover:bg-blue-500'}`} />
                  Video Lecture
                </a>
              </nav>
            </div>

            <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <CheckCircle2 size={64} />
              </div>
              <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Overall Progress</div>
              <div className="text-3xl font-black tracking-tight mb-4">{progress}%</div>
              <div className="flex items-center justify-between mb-3 text-[9px] font-black uppercase tracking-widest opacity-75">
                <span>Video {videoProgress}%</span>
                <span>Scroll {scrollProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white transition-all duration-1000" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  )
}

export default ModuleViewerPage