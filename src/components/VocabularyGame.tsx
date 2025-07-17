import { useState, useEffect } from 'react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { blink } from '../blink/client'
import { getRandomWords } from '../data/vocabulary'
import { WordPair } from '../types/game'
import { ArrowLeft, Star, Volume2, CheckCircle, XCircle } from 'lucide-react'
import { useToast } from '../hooks/use-toast'

interface VocabularyGameProps {
  onBack: () => void
}

export default function VocabularyGame({ onBack }: VocabularyGameProps) {
  const [currentWord, setCurrentWord] = useState<WordPair | null>(null)
  const [options, setOptions] = useState<string[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [score, setScore] = useState(0)
  const [questionNumber, setQuestionNumber] = useState(1)
  const [gameWords, setGameWords] = useState<WordPair[]>([])
  const [showResult, setShowResult] = useState(false)
  const [user, setUser] = useState(null)
  const { toast } = useToast()

  const totalQuestions = 10

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (user) {
      initializeGame()
    }
  }, [user])

  const initializeGame = () => {
    const words = getRandomWords(totalQuestions, 1) // Start with difficulty 1
    setGameWords(words)
    loadNextQuestion(words, 0)
  }

  const loadNextQuestion = (words: WordPair[], index: number) => {
    if (index >= words.length) {
      endGame()
      return
    }

    const word = words[index]
    setCurrentWord(word)
    
    // Create options with correct answer and 3 random wrong answers
    const allWords = getRandomWords(20, 1)
    const wrongAnswers = allWords
      .filter(w => w.id !== word.id)
      .map(w => w.english)
      .slice(0, 3)
    
    const allOptions = [word.english, ...wrongAnswers]
    setOptions(allOptions.sort(() => Math.random() - 0.5))
    
    setSelectedAnswer(null)
    setIsCorrect(null)
    setShowResult(false)
  }

  const handleAnswerSelect = (answer: string) => {
    if (selectedAnswer) return // Prevent multiple selections
    
    setSelectedAnswer(answer)
    const correct = answer === currentWord?.english
    setIsCorrect(correct)
    setShowResult(true)
    
    if (correct) {
      setScore(score + 1)
      toast({
        title: "Excellent! 🎉",
        description: `${currentWord?.french} means ${currentWord?.english}!`,
      })
    } else {
      toast({
        title: "Not quite! 🤔",
        description: `${currentWord?.french} means ${currentWord?.english}`,
        variant: "destructive"
      })
    }
    
    // Auto-advance after 2 seconds
    setTimeout(() => {
      if (questionNumber < totalQuestions) {
        setQuestionNumber(questionNumber + 1)
        loadNextQuestion(gameWords, questionNumber)
      } else {
        endGame()
      }
    }, 2000)
  }

  const endGame = async () => {
    try {
      // Save game session
      await blink.db.gameSessions.create({
        userId: user.id,
        gameType: 'vocabulary',
        score: score,
        correctAnswers: score,
        totalQuestions: totalQuestions,
        timeSpent: 0, // Could track this with a timer
        completedAt: new Date()
      })

      // Update progress
      const progressData = await blink.db.gameProgress.list({
        where: { userId: user.id },
        limit: 1
      })

      if (progressData.length > 0) {
        const progress = progressData[0]
        const newWordsLearned = [...(progress.wordsLearned || []), ...gameWords.map(w => w.id)]
        const uniqueWords = [...new Set(newWordsLearned)]
        
        await blink.db.gameProgress.update(progress.id, {
          score: (progress.score || 0) + score,
          wordsLearned: uniqueWords,
          updatedAt: new Date()
        })
      }
    } catch (error) {
      console.error('Error saving game results:', error)
      // Continue with game completion even if database save fails
    }

    toast({
      title: "Game Complete! 🏆",
      description: `You scored ${score}/${totalQuestions}!`,
    })
  }

  const playPronunciation = async () => {
    if (!currentWord) return
    
    try {
      const { url } = await blink.ai.generateSpeech({
        text: currentWord.french,
        voice: 'nova'
      })
      
      const audio = new Audio(url)
      audio.play()
    } catch (error) {
      console.error('Error playing pronunciation:', error)
      toast({
        title: "Audio Error",
        description: "Could not play pronunciation",
        variant: "destructive"
      })
    }
  }

  if (!currentWord) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-bounce-in text-center">
          <div className="text-6xl mb-4">🎮</div>
          <p className="font-heading text-xl">Loading game...</p>
        </div>
      </div>
    )
  }

  if (questionNumber > totalQuestions) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full animate-bounce-in">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="font-heading text-3xl mb-4">Game Complete!</h2>
            <div className="text-4xl font-heading text-primary mb-4">{score}/{totalQuestions}</div>
            <p className="text-lg mb-6">
              {score >= 8 ? "Excellent work!" : score >= 6 ? "Good job!" : "Keep practicing!"}
            </p>
            <div className="flex gap-4">
              <Button onClick={initializeGame} className="flex-1">
                Play Again
              </Button>
              <Button variant="outline" onClick={onBack} className="flex-1">
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        
        <div className="flex items-center gap-4">
          <Badge variant="outline">{questionNumber}/{totalQuestions}</Badge>
          <div className="flex items-center gap-1">
            <Star className="w-5 h-5 text-yellow-500" />
            <span className="font-medium">{score}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8 animate-slide-up">
        <Progress value={(questionNumber - 1) / totalQuestions * 100} className="h-3" />
      </div>

      {/* Question Card */}
      <Card className="mb-8 animate-bounce-in">
        <CardContent className="p-8 text-center">
          <h2 className="text-sm text-muted-foreground mb-2">What does this mean in English?</h2>
          
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="font-heading text-5xl text-primary">{currentWord.french}</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={playPronunciation}
              className="p-2 hover:bg-secondary"
            >
              <Volume2 className="w-6 h-6" />
            </Button>
          </div>
          
          <Badge className="mb-6">{currentWord.category}</Badge>
        </CardContent>
      </Card>

      {/* Answer Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {options.map((option, index) => {
          let buttonClass = "h-16 text-lg font-medium transition-all duration-300"
          
          if (showResult && selectedAnswer) {
            if (option === currentWord.english) {
              buttonClass += " bg-green-500 hover:bg-green-500 text-white"
            } else if (option === selectedAnswer && !isCorrect) {
              buttonClass += " bg-red-500 hover:bg-red-500 text-white"
            } else {
              buttonClass += " opacity-50"
            }
          } else {
            buttonClass += " hover:scale-105"
          }
          
          return (
            <Button
              key={index}
              variant={selectedAnswer === option ? "default" : "outline"}
              className={buttonClass}
              onClick={() => handleAnswerSelect(option)}
              disabled={showResult}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-center gap-2">
                {showResult && option === currentWord.english && (
                  <CheckCircle className="w-5 h-5" />
                )}
                {showResult && option === selectedAnswer && !isCorrect && (
                  <XCircle className="w-5 h-5" />
                )}
                {option}
              </div>
            </Button>
          )
        })}
      </div>

      {/* Result Feedback */}
      {showResult && (
        <Card className={`animate-bounce-in ${isCorrect ? 'border-green-500' : 'border-red-500'}`}>
          <CardContent className="p-6 text-center">
            <div className={`text-4xl mb-2 ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
              {isCorrect ? '🎉' : '🤔'}
            </div>
            <h3 className={`font-heading text-xl mb-2 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
              {isCorrect ? 'Correct!' : 'Not quite!'}
            </h3>
            <p className="text-muted-foreground">
              <strong>{currentWord.french}</strong> means <strong>{currentWord.english}</strong>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}