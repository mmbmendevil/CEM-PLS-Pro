import { Sun } from 'lucide-react'
import { useBrightness } from '../contexts/BrightnessContext'

type ThemeToggleProps = {
  className?: string
}

const ThemeToggle = ({ className = '' }: ThemeToggleProps) => {
  const { isBrightMode, toggleBrightness } = useBrightness()

  return (
    <button
      type="button"
      onClick={toggleBrightness}
      title={isBrightMode ? 'Switch to dark mode' : 'Switch to light mode'}
      aria-label={isBrightMode ? 'Switch to dark mode' : 'Switch to light mode'}
      className={`p-2 rounded-full border transition-colors ${
        isBrightMode
          ? 'border-amber-300 bg-white/80 hover:bg-white'
          : 'border-gray-800 bg-gray-900/50 hover:bg-gray-800'
      } ${className}`}
    >
      <Sun
        size={18}
        className={`transition-transform duration-300 ${
          isBrightMode ? 'text-amber-500 rotate-12' : 'text-yellow-400'
        }`}
      />
    </button>
  )
}

export default ThemeToggle
