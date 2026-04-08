import { BrightnessProvider } from './contexts/BrightnessContext'
import { GradingStageProvider } from './contexts/GradingStageContext'
import AppRoutes from './routes/AppRoutes'

function App() {
  return (
    <BrightnessProvider>
      <GradingStageProvider>
        <AppRoutes />
      </GradingStageProvider>
    </BrightnessProvider>
  )
}

export default App
