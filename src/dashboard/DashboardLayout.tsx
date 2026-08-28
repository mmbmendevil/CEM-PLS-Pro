import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import { useBrightness } from '../contexts/BrightnessContext'
import { GradingStageProvider } from '@/contexts/GradingStageContext'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

const DashboardLayout = () => {
  const { isBrightMode } = useBrightness()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  return (
    <GradingStageProvider>
      <div className={`min-h-screen flex overflow-x-hidden transition-colors ${isBrightMode ? 'bg-[#fffdf7] text-black' : 'bg-[#0f172a] text-white'}`}>
        <Sidebar isMobileOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />
        <div className="flex-1 min-w-0 flex flex-col">
          <TopBar onMenuClick={() => setIsMobileSidebarOpen(true)} />
          <main className={`flex-1 min-w-0 p-4 sm:p-6 lg:p-8 ${isBrightMode ? 'bg-[#fffdf7]' : 'bg-[#0f172a]'}`}>
            <Outlet />
          </main>
        </div>
      </div>
    </GradingStageProvider>
  )
}

export default DashboardLayout
