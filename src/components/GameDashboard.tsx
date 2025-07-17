import { useState, useEffect } from 'react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { blink } from '../blink/client'
import { GameProgress } from '../types/game'
import { Star, Trophy, BookOpen, Brain, Volume2, Target } from 'lucide-react'

interface GameDashboardProps {
  onNavigate: (view: 'vocabulary' | 'memory' | 'progress') => void
  user: any
}

export default function GameDashboard({ onNavigate, user }: GameDashboardProps) {
  const [progress, setProgress] = useState<GameProgress | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProgress()
  }, [user])

  const loadProgress = async () => {
    try {
      const progressData = await blink.db.gameProgress.list({
        where: { userId: user.id },
        limit: 1
      })

      if (progressData.length > 0) {
        setProgress(progressData[0])
      } else {
        // Create initial progress
        const newProgress = await blink.db.gameProgress.create({
          userId: user.id,
          level: 1,
          score: 0,
          wordsLearned: [],
          achievements: [],
          createdAt: new Date(),
          updatedAt: new Date()
        })
        setProgress(newProgress)
      }
    } catch (error) {
      console.error('Error loading progress:', error)
      // Set default progress if database is not available
      setProgress({
        id: 'default',
        userId: user.id,
        level: 1,
        score: 0,
        wordsLearned: [],
        achievements: [],
        createdAt: new Date(),
        updatedAt: new Date()
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-bounce-in text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="font-heading text-xl">Loading your progress...</p>
        </div>
      </div>
    )
  }

  const gameCards = [
    {
      id: 'vocabulary',
      title: 'Vocabulary Match',
      description: 'Match French words with English translations',
      icon: BookOpen,
      color: 'bg-blue-500',
      difficulty: 'Easy',
      time: '5-10 min'
    },
    {
      id: 'memory',
      title: 'Memory Cards',
      description: 'Find matching pairs of French and English words',
      icon: Brain,
      color: 'bg-purple-500',
      difficulty: 'Medium',
      time: '10-15 min'
    },
    {
      id: 'pronunciation',
      title: 'Pronunciation',
      description: 'Listen and repeat French words',
      icon: Volume2,
      color: 'bg-green-500',
      difficulty: 'Easy',
      time: '5-10 min',
      comingSoon: true
    }
  ]

  return (
    <div className="min-h-screen p-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8 animate-fade-in">
        <div className="text-6xl mb-4">🇫🇷</div>
        <h1 className="font-heading text-4xl text-primary mb-2">
          Bonjour, {user.displayName || user.email?.split('@')[0]}!
        </h1>
        <p className="text-lg text-muted-foreground">Ready to learn some French today?</p>
      </div>

      {/* Progress Overview */}
      <Card className="mb-8 animate-slide-up">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="w-8 h-8 text-yellow-500 mr-2" />
                <span className="font-heading text-2xl">{progress?.level || 1}</span>
              </div>
              <p className="text-sm text-muted-foreground">Current Level</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Star className="w-8 h-8 text-primary mr-2" />
                <span className="font-heading text-2xl">{progress?.score || 0}</span>
              </div>
              <p className="text-sm text-muted-foreground">Total Stars</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <BookOpen className="w-8 h-8 text-secondary mr-2" />
                <span className="font-heading text-2xl">{progress?.wordsLearned?.length || 0}</span>
              </div>
              <p className="text-sm text-muted-foreground">Words Learned</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Target className="w-8 h-8 text-accent mr-2" />
                <span className="font-heading text-2xl">{progress?.achievements?.length || 0}</span>
              </div>
              <p className="text-sm text-muted-foreground">Achievements</p>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Level Progress</span>
              <span className="text-sm text-muted-foreground">
                {Math.min(((progress?.wordsLearned?.length || 0) % 10) * 10, 100)}%
              </span>
            </div>
            <Progress 
              value={Math.min(((progress?.wordsLearned?.length || 0) % 10) * 10, 100)} 
              className="h-3"
            />
          </div>
        </CardContent>
      </Card>

      {/* Game Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {gameCards.map((game, index) => {
          const IconComponent = game.icon
          return (
            <Card 
              key={game.id} 
              className={`cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg animate-slide-up ${
                game.comingSoon ? 'opacity-60' : ''
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => !game.comingSoon && onNavigate(game.id as any)}
            >
              <CardContent className="p-6 text-center">
                <div className={`w-16 h-16 ${game.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="font-heading text-xl mb-2">{game.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{game.description}</p>
                
                <div className="flex justify-center gap-2 mb-4">
                  <Badge variant="secondary">{game.difficulty}</Badge>
                  <Badge variant="outline">{game.time}</Badge>
                </div>
                
                {game.comingSoon ? (
                  <Badge className="bg-yellow-500 text-yellow-900">Coming Soon!</Badge>
                ) : (
                  <Button className="w-full font-medium">
                    Play Now! 🎮
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
        <Button 
          variant="outline" 
          size="lg"
          onClick={() => onNavigate('progress')}
          className="font-medium"
        >
          <Trophy className="w-5 h-5 mr-2" />
          View Progress
        </Button>
        
        <Button 
          variant="outline" 
          size="lg"
          onClick={() => blink.auth.logout()}
          className="font-medium"
        >
          Sign Out
        </Button>
      </div>
    </div>
  )
}