import { useState, useEffect } from 'react'
import { blink } from './blink/client'
import GameDashboard from './components/GameDashboard'
import VocabularyGame from './components/VocabularyGame'
import MemoryGame from './components/MemoryGame'
import ProgressTracker from './components/ProgressTracker'
import { Toaster } from './components/ui/toaster'

type GameView = 'dashboard' | 'vocabulary' | 'memory' | 'progress'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState<GameView>('dashboard')

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-bounce-in">
            <div className="text-6xl mb-4">🎮</div>
            <h1 className="font-heading text-2xl text-primary">Loading French Fun...</h1>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="animate-bounce-in">
            <div className="text-8xl mb-6">🇫🇷</div>
            <h1 className="font-heading text-4xl text-primary mb-4">French Learning Game</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Learn French through fun games and activities!
            </p>
            <button
              onClick={() => blink.auth.login()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-full font-medium text-lg transition-colors"
            >
              Start Learning! 🚀
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'vocabulary':
        return <VocabularyGame onBack={() => setCurrentView('dashboard')} />
      case 'memory':
        return <MemoryGame onBack={() => setCurrentView('dashboard')} />
      case 'progress':
        return <ProgressTracker onBack={() => setCurrentView('dashboard')} />
      default:
        return <GameDashboard onNavigate={setCurrentView} user={user} />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {renderCurrentView()}
      <Toaster />
    </div>
  )
}

export default App