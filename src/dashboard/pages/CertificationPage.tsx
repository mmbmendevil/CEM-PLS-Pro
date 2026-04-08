import { onAuthStateChanged } from 'firebase/auth'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { Brain, CalendarDays, Download, Printer, ShieldAlert } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useBrightness } from '@/contexts/BrightnessContext'
import { MODULES_CATALOG } from '@/dashboard/data/modulesCatalog'
import { auth } from '@/lib/firebase'
import { ROUTE_PATHS } from '@/routes/paths'
import { getUserAssessmentProgress } from '@/services/assessmentProgress'
import { getUserModuleProgress } from '@/services/moduleProgress'
import { getUserProfile } from '@/services/userProfiles'
import { getStageSummativeRecord } from '../data/learningStage'

const CertificationPage = () => {
  const { isBrightMode } = useBrightness()
  const [fullName, setFullName] = useState('Learner')
  const [certificateId, setCertificateId] = useState('PLS-0000-00000')
  const [finalScore, setFinalScore] = useState<number | null>(null)
  const [completedModules, setCompletedModules] = useState<string[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const certificateRef = useRef<HTMLDivElement | null>(null)


  useEffect(() => {
    let isCancelled = false

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!isCancelled) {
          setFullName('Learner')
          setFinalScore(null)
          setIsComplete(false)
          setIsLoading(false)
        }
        return
      }

      const [profile, assessmentRecords, moduleRecords] = await Promise.all([
        getUserProfile(user.uid),
        getUserAssessmentProgress(user.uid),
        getUserModuleProgress(user.uid),
      ])

      if (isCancelled) {
        return
      }

      const assessmentMap = new Map(assessmentRecords.map((record) => [record.assessmentKey, record]))
      const finalSummativeRecord = getStageSummativeRecord(assessmentMap, 'final')
      const completed = finalSummativeRecord?.isSubmitted === true || finalSummativeRecord?.isFinished === true
      const completedIds = new Set(
        moduleRecords
          .filter((record) => record.isCompleted === true || (record.overallProgress ?? 0) >= 100)
          .map((record) => record.moduleId),
      )

      const moduleNames = MODULES_CATALOG
        .filter((module) => completedIds.has(module.id))
        .map((module) => module.title)

      setIsComplete(completed)
      setFinalScore(typeof finalSummativeRecord?.percentage === 'number' ? Math.round(finalSummativeRecord.percentage) : null)
      setCompletedModules(moduleNames)
      setCertificateId(`PLS-${new Date().getFullYear()}-AT-${user.uid.slice(0, 5).toUpperCase()}`)

      if (profile?.fullName) {
        setFullName(profile.fullName)
      } else if (user.displayName) {
        setFullName(user.displayName)
      } else if (user.email) {
        setFullName(user.email.split('@')[0])
      } else {
        setFullName('Learner')
      }

      setIsLoading(false)
    })

    return () => {
      isCancelled = true
      unsubscribe()
    }
  }, [])

  const issuedOn = useMemo(() => {
    const now = new Date()
    return now.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
  }, [])

  const totalLearningHours = useMemo(() => {
    const hours = completedModules.length * 15
    return hours > 0 ? `${hours} Hours` : '120 Hours'
  }, [completedModules.length])

  const onPrint = () => {
    window.print()
  }

  const onDownload = async () => {
    if (!certificateRef.current) {
      return
    }

    const canvas = await html2canvas(certificateRef.current, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
    })

    const image = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height],
    })

    pdf.addImage(image, 'PNG', 0, 0, canvas.width, canvas.height)
    pdf.save(`certificate-${fullName.toLowerCase().replace(/\s+/g, '-')}.pdf`)
  }

  if (isLoading) {
    return <section className={`min-h-screen rounded-3xl p-8 ${isBrightMode ? 'bg-[#fffdf7]' : 'bg-[#0f172a]'}`} />
  }

  if (!isComplete) {
    return (
      <section className={`rounded-3xl border p-8 ${isBrightMode ? 'border-gray-200 bg-white text-gray-900' : 'border-slate-700/60 bg-slate-900/70 text-slate-100'}`}>
        <h1 className="text-3xl font-bold tracking-tight">Certification</h1>
        <p className={`mt-3 text-sm ${isBrightMode ? 'text-gray-600' : 'text-slate-300'}`}>
          Complete the Final grading stage to unlock your certificate.
        </p>
        <Link
          to={ROUTE_PATHS.dashboard.results}
          className="mt-6 inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          Back to Learning Results
        </Link>
      </section>
    )
  }

  return (
    <main className={`min-h-screen p-4 md:p-8 ${isBrightMode ? 'bg-[#d8deeb]' : 'bg-[#0f172a]'}`}>
      <section className="mx-auto w-full max-w-6xl space-y-5">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
          <div className="inline-flex items-center gap-3">
            <div className="rounded-xl bg-[#4f46e5]/10 p-2 text-[#4f46e5]">
              <Brain size={22} />
            </div>
            <h1 className={`text-2xl font-black tracking-tight ${isBrightMode ? 'text-[#1e293b]' : 'text-slate-100'}`}>
              Personalized Learning System
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPrint}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              <Printer size={16} />
              Print
            </button>
            <button
              type="button"
              onClick={onDownload}
              className="inline-flex items-center gap-2 rounded-xl bg-[#4f46e5] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4338ca]"
            >
              <Download size={16} />
              Download
            </button>
          </div>
        </header>

        <article className="rounded-2xl border border-[#f0d35e] bg-[#fff9dc]/90 p-5 print:hidden">
          <div className="inline-flex items-center gap-2 text-2xl text-[#a16207]">
            <ShieldAlert size={20} />
            <h2 className="text-3xl font-bold">For Internal Use Only</h2>
          </div>
          <p className="mt-2 text-lg leading-relaxed text-[#9a5b0b]">
            This certificate is for demonstration and personal reference purposes only. It is not eligible for outside reference, academic credit, or professional certification. This is a learning platform certificate and should not be submitted for employment or education verification.
          </p>
        </article>

        <div
          ref={certificateRef}
          className="rounded-2xl border-2 border-[#b8c4ff] bg-white p-2"
        >
          <article className="relative rounded-xl border-2 border-[#9fb0ff] bg-white px-4 py-8 text-[#1e293b] md:px-10 md:py-14">
            <div className="absolute left-5 top-5 h-20 w-20 border-l-4 border-t-4 border-[#9fb0ff]" />
            <div className="absolute right-5 top-5 h-20 w-20 border-r-4 border-t-4 border-[#9fb0ff]" />
            <div className="absolute bottom-5 left-5 h-20 w-20 border-b-4 border-l-4 border-[#9fb0ff]" />
            <div className="absolute bottom-5 right-5 h-20 w-20 border-b-4 border-r-4 border-[#9fb0ff]" />

            <div className="mx-auto max-w-4xl text-center">
              <div className="inline-flex items-center gap-3 text-[#5848ff]">
                <span className="text-xl">✦</span>
                <Brain size={28} />
                <span className="text-xl">✦</span>
              </div>

              <h2 className="mt-5 text-5xl font-black tracking-tight md:text-7xl">Certificate of Completion</h2>
              <div className="mx-auto mt-3 h-0.5 w-72 bg-[#d2d8f0]" />

              <p className="mt-8 text-3xl text-[#64748b]">This is to certify that</p>

              <p
                className="mt-6 text-6xl italic text-[#312e81] md:text-8xl"
                style={{ fontFamily: '"Playfair Display", Georgia, "Times New Roman", serif' }}
              >
                {fullName}
              </p>

              <p className="mt-8 text-3xl text-[#64748b]">has successfully completed the</p>

              <div className="mx-auto mt-5 inline-flex max-w-full rounded-2xl bg-linear-to-r from-[#4f46e5] to-[#8b1de8] px-5 py-3 text-center text-3xl font-black text-white md:px-10 md:py-4 md:text-5xl">
                AI-Powered Personalized Learning Program
              </div>

              <div className="mt-14">
                <p className="text-3xl text-[#475569]">Completed Modules:</p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  {(completedModules.length > 0 ? completedModules : ['Introduction to AI Learning', 'Adaptive Learning Pathways', 'Machine Learning Fundamentals', 'Natural Language Processing', 'Computer Vision Basics', 'Data Science Principles', 'Neural Networks', 'Deep Learning Applications']).map((moduleName) => (
                    <span
                      key={moduleName}
                      className="rounded-xl bg-[#d8defa] px-4 py-2 text-base font-bold text-[#4f46e5] md:text-lg"
                    >
                      {moduleName}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-[#eef0f6] p-5 text-left">
                  <p className="text-base text-[#64748b]">Total Learning Hours</p>
                  <p className="mt-2 text-5xl font-black text-[#4f46e5]">{totalLearningHours}</p>
                </div>
                <div className="rounded-xl bg-[#eef0f6] p-5 text-left">
                  <p className="text-base text-[#64748b]">Completion Date</p>
                  <p className="mt-2 inline-flex items-center gap-2 text-5xl font-black text-[#4f46e5]">
                    <CalendarDays size={22} /> {issuedOn}
                  </p>
                </div>
              </div>

              <div className="mx-auto mt-12 border-t border-[#d2d8e6] pt-10">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div>
                    <p
                      className="text-5xl italic text-[#334155]"
                      style={{ fontFamily: '"Playfair Display", Georgia, "Times New Roman", serif' }}
                    >
                      AI Learning Director
                    </p>
                    <p className="mt-2 border-t border-[#94a3b8] pt-2 text-2xl text-[#64748b]">Program Director</p>
                  </div>

                  <div>
                    <p className="text-5xl font-semibold text-[#334155]">{certificateId}</p>
                    <p className="mt-2 border-t border-[#94a3b8] pt-2 text-2xl text-[#64748b]">Certificate ID</p>
                  </div>
                </div>
              </div>

              <div className="mt-12 text-center text-base italic text-[#94a3b8] md:text-lg">
                Personalized Learning System - AI-Powered Adaptive Education Platform
                <br />
                Internal Recognition Only - Not Valid for External Verification
              </div>
            </div>
          </article>
        </div>

        <aside className={`rounded-2xl border p-6 ${isBrightMode ? 'border-gray-200 bg-white/80 text-[#334155]' : 'border-slate-700 bg-slate-900/80 text-slate-200'} print:hidden`}>
          <h3 className="text-3xl font-extrabold">About Your Certificate</h3>
          <ul className="mt-4 space-y-2 text-lg">
            <li>• This certificate recognizes your completion of modules within the Personalized Learning System</li>
            <li>• AI learning was personalized using AI-powered adaptive technology</li>
            <li>• Certificate is for personal achievement tracking and motivation</li>
            <li>• Not accredited by any educational institution or professional organization</li>
            {finalScore !== null ? <li>• Final stage score recorded: {finalScore}%</li> : null}
          </ul>

          <Link
            to={ROUTE_PATHS.dashboard.results}
            className="mt-6 inline-flex items-center rounded-lg bg-[#4f46e5] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4338ca]"
          >
            Back to Learning Results
          </Link>
        </aside>
      </section>
    </main>
  )
}

export default CertificationPage
