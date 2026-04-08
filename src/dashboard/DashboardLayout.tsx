import { Outlet } from 'react-router-dom'
import { useBrightness } from '../contexts/BrightnessContext'
import { GradingStageProvider } from '@/contexts/GradingStageContext'
import Sidebar from './Sidebar.tsx'
import TopBar from './TopBar'

const DashboardLayout = () => {
  const { isBrightMode } = useBrightness()

  return (
    <GradingStageProvider>
      <div className={`min-h-screen flex transition-colors ${isBrightMode ? 'bg-[#fffdf7] text-black' : 'bg-[#0f172a] text-white'}`}>
        <Sidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <TopBar />
          <main className={`flex-1 p-8 ${isBrightMode ? 'bg-[#fffdf7]' : 'bg-[#0f172a]'}`}>
            <Outlet />
          </main>
        </div>
      </div>
    </GradingStageProvider>
  )
}

export default DashboardLayout
