import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { LearningStageKey } from '../dashboard/data/learningStage'

type GradingStageContextValue = {
  selectedStage: LearningStageKey | null
  setSelectedStage: (stage: LearningStageKey | null) => void
}

const GradingStageContext = createContext<GradingStageContextValue | undefined>(undefined)

const STORAGE_KEY = 'pls-grading-stage'

export const GradingStageProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedStage, setSelectedStageState] = useState<LearningStageKey | null>(() => {
    const savedStage = localStorage.getItem(STORAGE_KEY)

    if (savedStage === 'prelim' || savedStage === 'midterm' || savedStage === 'final') {
      return savedStage
    }

    return null
  })

  const setSelectedStage = (stage: LearningStageKey | null) => {
    setSelectedStageState(stage)
  }

  useEffect(() => {
    if (selectedStage) {
      localStorage.setItem(STORAGE_KEY, selectedStage)
      return
    }

    localStorage.removeItem(STORAGE_KEY)
  }, [selectedStage])

  const value = useMemo(
    () => ({
      selectedStage,
      setSelectedStage,
    }),
    [selectedStage],
  )

  return <GradingStageContext.Provider value={value}>{children}</GradingStageContext.Provider>
}

export const useGradingStage = () => {
  const context = useContext(GradingStageContext)

  if (!context) {
    throw new Error('useGradingStage must be used inside GradingStageProvider')
  }

  return context
}