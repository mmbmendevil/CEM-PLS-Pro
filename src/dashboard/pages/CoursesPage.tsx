import { CheckCircle2, ChevronRight, Layers, Lock } from 'lucide-react'
import { useBrightness } from '../../contexts/BrightnessContext'

const CoursesPage = () => {
  const { isBrightMode } = useBrightness()

  const surface = isBrightMode ? 'bg-white/80 border-slate-200' : 'bg-[#111827] border-slate-700/60'
  const mutedText = isBrightMode ? 'text-slate-500' : 'text-slate-300'

  return (
    <main className={`min-h-[calc(100vh-6rem)] rounded-4xl p-6 md:p-10 ${surface}`}>
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Curriculum</span>
          <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider ${isBrightMode ? 'bg-blue-500/10 text-blue-600' : 'bg-blue-500/15 text-blue-300'}`}>
            Academic Catalog
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
            <Layers size={24} />
          </div>
          <h1 className={`text-4xl md:text-5xl font-black tracking-tight ${isBrightMode ? 'text-slate-900' : 'text-white'}`}>
            Courses
          </h1>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`border-2 rounded-[2.5rem] p-8 relative overflow-hidden group ${isBrightMode ? 'bg-white border-blue-600/50' : 'bg-[#0f172a] border-blue-500/50'}`}>
          <div className="flex justify-between items-start mb-10">
            <div className="h-10 w-10 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <CheckCircle2 size={20} />
            </div>
            <span className="px-3 py-1 bg-emerald-500 text-white text-[9px] font-black rounded-full uppercase tracking-widest flex items-center gap-1">
              <CheckCircle2 size={10} /> Enrolled
            </span>
          </div>
          <h3 className={`text-2xl font-black uppercase tracking-tight leading-tight mb-3 ${isBrightMode ? 'text-slate-900' : 'text-white'}`}>
            Computer Organization and Architecture
          </h3>
          <p className={`text-sm font-medium mb-12 ${mutedText}`}>Core subject for thesis study.</p>

          <div className={`border-t border-dashed pt-8 ${isBrightMode ? 'border-slate-200' : 'border-slate-700/50'}`}>
            <button className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02]">
              Enter Course <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <LockedCourseCard
          title="Data Structures and Algorithms"
          description="Learn foundational data structures, algorithm design, and complexity analysis."
          isBrightMode={isBrightMode}
        />

        <LockedCourseCard
          title="Artificial Intelligence"
          description="Introduction to intelligent systems, search algorithms, and the theoretical foundations of machine learning."
          isBrightMode={isBrightMode}
        />
      </div>
    </main>
  )
}

const LockedCourseCard = ({
  title,
  description,
  isBrightMode,
}: {
  title: string
  description: string
  isBrightMode: boolean
}) => (
  <div className={`border rounded-[2.5rem] p-8 flex flex-col opacity-70 ${isBrightMode ? 'bg-white border-slate-200' : 'bg-[#0f172a] border-slate-700/60'}`}>
    <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-10 ${isBrightMode ? 'bg-slate-100 text-slate-500' : 'bg-white/5 text-slate-500'}`}>
      <Lock size={20} />
    </div>
    <h3 className={`text-2xl font-black uppercase tracking-tight leading-tight mb-3 ${isBrightMode ? 'text-slate-500' : 'text-slate-300'}`}>
      {title}
    </h3>
    <p className={`text-xs font-medium mb-12 leading-relaxed ${isBrightMode ? 'text-slate-500' : 'text-slate-400'}`}>
      {description}
    </p>
    <div className={`mt-auto border-t border-dashed pt-8 ${isBrightMode ? 'border-slate-200' : 'border-slate-700/60'}`}>
      <button disabled className="w-full h-14 bg-white/5 text-slate-500 font-black uppercase tracking-widest text-[10px] rounded-2xl flex items-center justify-center gap-2">
        <Lock size={14} /> Locked (Coming Soon)
      </button>
    </div>
  </div>
)

export default CoursesPage
