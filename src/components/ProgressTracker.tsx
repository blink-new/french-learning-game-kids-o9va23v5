import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { blink } from '../blink/client'
import { GameProgress, GameSession } from '../types/game'
import { ArrowLeft, Trophy, Star, BookOpen, Brain, Target, Calendar, TrendingUp } from 'lucide-react'

interface ProgressTrackerProps {
  onBack: () => void
}

export default function ProgressTracker({ onBack }: ProgressTrackerProps) {
  const [progress, setProgress] = useState<GameProgress | null>(null)
  const [sessions, setSessions] = useState<GameSession[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (user) {
      loadProgressData()
    }
  }, [user])

  const loadProgressData = async () => {
    try {
      // Load progress
      const progressData = await blink.db.gameProgress.list({
        where: { userId: user.id },
        limit: 1
      })

      if (progressData.length > 0) {
        setProgress(progressData[0])
      }

      // Load recent sessions
      const sessionsData = await blink.db.gameSessions.list({
        where: { userId: user.id },
        orderBy: { completedAt: 'desc' },
        limit: 10
      })

      setSessions(sessionsData)
    } catch (error) {
      console.error('Error loading progress data:', error)
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
      setSessions([])
    } finally {
      setLoading(false)
    }
  }

  const getGameTypeIcon = (gameType: string) => {
    switch (gameType) {
      case 'vocabulary':
        return <BookOpen className="w-4 h-4" />
      case 'memory':
        return <Brain className="w-4 h-4" />
      default:
        return <Target className="w-4 h-4" />
    }
  }

  const getGameTypeName = (gameType: string) => {
    switch (gameType) {
      case 'vocabulary':
        return 'Vocabulary Match'
      case 'memory':
        return 'Memory Cards'
      default:
        return 'Game'
    }
  }

  const calculateStats = () => {
    const totalGames = sessions.length
    const totalScore = sessions.reduce((sum, session) => sum + session.score, 0)
    const averageScore = totalGames > 0 ? Math.round(totalScore / totalGames) : 0
    const vocabularyGames = sessions.filter(s => s.gameType === 'vocabulary').length
    const memoryGames = sessions.filter(s => s.gameType === 'memory').length

    return {
      totalGames,
      totalScore,
      averageScore,
      vocabularyGames,
      memoryGames
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-bounce-in text-center">
          <div className="text-6xl mb-4">📊</div>
          <p className="font-heading text-xl">Loading your progress...</p>
        </div>
      </div>
    )
  }

  const stats = calculateStats()

  return (
    <div className="min-h-screen p-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
        
        <h1 className="font-heading text-2xl">Your Progress</h1>
        <div></div>
      </div>

      {/* Overall Progress */}
      <Card className="mb-8 animate-slide-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Overall Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-heading text-primary mb-2">{progress?.level || 1}</div>
              <p className="text-sm text-muted-foreground">Current Level</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-heading text-yellow-500 mb-2">{progress?.score || 0}</div>
              <p className="text-sm text-muted-foreground">Total Stars</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-heading text-secondary mb-2">{progress?.wordsLearned?.length || 0}</div>
              <p className="text-sm text-muted-foreground">Words Learned</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-heading text-accent mb-2">{stats.totalGames}</div>
              <p className="text-sm text-muted-foreground">Games Played</p>
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
            <p className="text-xs text-muted-foreground mt-1">
              Learn {10 - ((progress?.wordsLearned?.length || 0) % 10)} more words to reach the next level
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Game Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">Average Score</span>
                <span className="font-medium">{stats.averageScore}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total Score</span>
                <span className="font-medium">{stats.totalScore}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Games Played</span>
                <span className="font-medium">{stats.totalGames}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="w-5 h-5" />
              Vocabulary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">Games Played</span>
                <span className="font-medium">{stats.vocabularyGames}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Words Learned</span>
                <span className="font-medium">{progress?.wordsLearned?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Favorite Category</span>
                <span className="font-medium">Animals</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="w-5 h-5" />
              Memory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">Games Played</span>
                <span className="font-medium">{stats.memoryGames}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Best Score</span>
                <span className="font-medium">
                  {Math.max(...sessions.filter(s => s.gameType === 'memory').map(s => s.score), 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Memory Level</span>
                <span className="font-medium">Beginner</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Games */}
      <Card className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Recent Games
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-4xl mb-2">🎮</div>
              <p>No games played yet. Start playing to see your progress!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.slice(0, 5).map((session, index) => (
                <div 
                  key={session.id} 
                  className="flex items-center justify-between p-4 border rounded-lg animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary rounded-full">
                      {getGameTypeIcon(session.gameType)}
                    </div>
                    <div>
                      <h4 className="font-medium">{getGameTypeName(session.gameType)}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(session.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-1 mb-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium">{session.score}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {session.correctAnswers}/{session.totalQuestions}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Achievements Section */}
      <Card className="mt-8 animate-slide-up" style={{ animationDelay: '0.5s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className={`p-4 border rounded-lg text-center ${stats.totalGames >= 1 ? 'bg-green-50 border-green-200' : 'opacity-50'}`}>
              <div className="text-2xl mb-2">🎯</div>
              <h4 className="font-medium mb-1">First Game</h4>
              <p className="text-xs text-muted-foreground">Play your first game</p>
            </div>
            
            <div className={`p-4 border rounded-lg text-center ${stats.totalGames >= 5 ? 'bg-green-50 border-green-200' : 'opacity-50'}`}>
              <div className="text-2xl mb-2">🔥</div>
              <h4 className="font-medium mb-1">Getting Started</h4>
              <p className="text-xs text-muted-foreground">Play 5 games</p>
            </div>
            
            <div className={`p-4 border rounded-lg text-center ${(progress?.wordsLearned?.length || 0) >= 10 ? 'bg-green-50 border-green-200' : 'opacity-50'}`}>
              <div className="text-2xl mb-2">📚</div>
              <h4 className="font-medium mb-1">Word Collector</h4>
              <p className="text-xs text-muted-foreground">Learn 10 words</p>
            </div>
            
            <div className={`p-4 border rounded-lg text-center ${stats.totalScore >= 100 ? 'bg-green-50 border-green-200' : 'opacity-50'}`}>
              <div className="text-2xl mb-2">⭐</div>
              <h4 className="font-medium mb-1">Star Collector</h4>
              <p className="text-xs text-muted-foreground">Earn 100 stars</p>
            </div>
            
            <div className={`p-4 border rounded-lg text-center ${stats.vocabularyGames >= 3 && stats.memoryGames >= 3 ? 'bg-green-50 border-green-200' : 'opacity-50'}`}>
              <div className="text-2xl mb-2">🎮</div>
              <h4 className="font-medium mb-1">Game Master</h4>
              <p className="text-xs text-muted-foreground">Play all game types</p>
            </div>
            
            <div className={`p-4 border rounded-lg text-center ${(progress?.level || 1) >= 3 ? 'bg-green-50 border-green-200' : 'opacity-50'}`}>
              <div className="text-2xl mb-2">🏆</div>
              <h4 className="font-medium mb-1">Level Up</h4>
              <p className="text-xs text-muted-foreground">Reach level 3</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}