import { useState, useEffect } from 'react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { blink } from '../blink/client'
import { getRandomWords } from '../data/vocabulary'
import { WordPair } from '../types/game'
import { ArrowLeft, Star, RotateCcw } from 'lucide-react'
import { useToast } from '../hooks/use-toast'

interface MemoryCard {
  id: string
  content: string
  type: 'french' | 'english'
  wordId: string
  isFlipped: boolean
  isMatched: boolean
}

interface MemoryGameProps {
  onBack: () => void
}

export default function MemoryGame({ onBack }: MemoryGameProps) {
  const [cards, setCards] = useState<MemoryCard[]>([])
  const [flippedCards, setFlippedCards] = useState<string[]>([])
  const [matchedPairs, setMatchedPairs] = useState<string[]>([])
  const [score, setScore] = useState(0)
  const [moves, setMoves] = useState(0)
  const [gameComplete, setGameComplete] = useState(false)
  const [user, setUser] = useState(null)
  const { toast } = useToast()

  const totalPairs = 6

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
    const words = getRandomWords(totalPairs, 1)
    const gameCards: MemoryCard[] = []

    // Create pairs of cards (French and English)
    words.forEach((word) => {
      gameCards.push({
        id: `${word.id}-french`,
        content: word.french,
        type: 'french',
        wordId: word.id,
        isFlipped: false,
        isMatched: false
      })
      gameCards.push({
        id: `${word.id}-english`,
        content: word.english,
        type: 'english',
        wordId: word.id,
        isFlipped: false,
        isMatched: false
      })
    })

    // Shuffle cards
    const shuffledCards = gameCards.sort(() => Math.random() - 0.5)
    setCards(shuffledCards)
    setFlippedCards([])
    setMatchedPairs([])
    setScore(0)
    setMoves(0)
    setGameComplete(false)
  }

  const handleCardClick = (cardId: string) => {
    if (flippedCards.length >= 2) return
    if (flippedCards.includes(cardId)) return
    if (matchedPairs.some(pair => pair === cards.find(c => c.id === cardId)?.wordId)) return

    const newFlippedCards = [...flippedCards, cardId]
    setFlippedCards(newFlippedCards)

    if (newFlippedCards.length === 2) {
      setMoves(moves + 1)
      checkForMatch(newFlippedCards)
    }
  }

  const checkForMatch = (flippedCardIds: string[]) => {
    const [card1Id, card2Id] = flippedCardIds
    const card1 = cards.find(c => c.id === card1Id)
    const card2 = cards.find(c => c.id === card2Id)

    if (card1 && card2 && card1.wordId === card2.wordId && card1.type !== card2.type) {
      // Match found!
      const newMatchedPairs = [...matchedPairs, card1.wordId]
      setMatchedPairs(newMatchedPairs)
      setScore(score + 10)
      
      toast({
        title: "Perfect Match! 🎉",
        description: `${card1.type === 'french' ? card1.content : card2.content} = ${card1.type === 'english' ? card1.content : card2.content}`,
      })

      // Check if game is complete
      if (newMatchedPairs.length === totalPairs) {
        setTimeout(() => {
          setGameComplete(true)
          saveGameResults()
        }, 1000)
      }

      setTimeout(() => {
        setFlippedCards([])
      }, 1000)
    } else {
      // No match
      setTimeout(() => {
        setFlippedCards([])
      }, 1500)
    }
  }

  const saveGameResults = async () => {
    try {
      // Save game session
      await blink.db.gameSessions.create({
        userId: user.id,
        gameType: 'memory',
        score: score + 10, // Add bonus for completion
        correctAnswers: matchedPairs.length,
        totalQuestions: totalPairs,
        timeSpent: 0,
        completedAt: new Date()
      })

      // Update progress
      const progressData = await blink.db.gameProgress.list({
        where: { userId: user.id },
        limit: 1
      })

      if (progressData.length > 0) {
        const progress = progressData[0]
        await blink.db.gameProgress.update(progress.id, {
          score: (progress.score || 0) + score + 10,
          updatedAt: new Date()
        })
      }
    } catch (error) {
      console.error('Error saving game results:', error)
      // Continue with game completion even if database save fails
    }

    toast({
      title: "Memory Master! 🧠",
      description: `Completed in ${moves} moves!`,
    })
  }

  const isCardFlipped = (cardId: string) => {
    const card = cards.find(c => c.id === cardId)
    return flippedCards.includes(cardId) || matchedPairs.includes(card?.wordId || '')
  }

  const isCardMatched = (cardId: string) => {
    const card = cards.find(c => c.id === cardId)
    return matchedPairs.includes(card?.wordId || '')
  }

  if (!cards.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-bounce-in text-center">
          <div className="text-6xl mb-4">🧠</div>
          <p className="font-heading text-xl">Preparing memory cards...</p>
        </div>
      </div>
    )
  }

  if (gameComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full animate-bounce-in">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🧠</div>
            <h2 className="font-heading text-3xl mb-4">Memory Master!</h2>
            <div className="space-y-2 mb-6">
              <div className="text-2xl font-heading text-primary">{score + 10} Stars</div>
              <div className="text-lg">Completed in {moves} moves</div>
              <p className="text-muted-foreground">
                {moves <= totalPairs + 2 ? "Perfect memory!" : moves <= totalPairs + 5 ? "Great job!" : "Keep practicing!"}
              </p>
            </div>
            <div className="flex gap-4">
              <Button onClick={initializeGame} className="flex-1">
                <RotateCcw className="w-4 h-4 mr-2" />
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
          <Badge variant="outline">Moves: {moves}</Badge>
          <div className="flex items-center gap-1">
            <Star className="w-5 h-5 text-yellow-500" />
            <span className="font-medium">{score}</span>
          </div>
        </div>
      </div>

      {/* Game Info */}
      <div className="text-center mb-8 animate-slide-up">
        <h1 className="font-heading text-3xl mb-2">Memory Match</h1>
        <p className="text-muted-foreground">Find matching pairs of French and English words</p>
        <div className="mt-4">
          <Badge className="mr-2">{matchedPairs.length}/{totalPairs} pairs found</Badge>
        </div>
      </div>

      {/* Memory Cards Grid */}
      <div className="grid grid-cols-3 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
        {cards.map((card, index) => (
          <Card
            key={card.id}
            className={`aspect-square cursor-pointer transition-all duration-500 transform hover:scale-105 animate-fade-in ${
              isCardMatched(card.id) ? 'ring-2 ring-green-500 bg-green-50' : ''
            } ${
              flippedCards.includes(card.id) && !isCardMatched(card.id) ? 'ring-2 ring-blue-500' : ''
            }`}
            style={{ animationDelay: `${index * 0.05}s` }}
            onClick={() => handleCardClick(card.id)}
          >
            <CardContent className="p-0 h-full flex items-center justify-center relative overflow-hidden">
              <div className={`absolute inset-0 transition-transform duration-500 ${
                isCardFlipped(card.id) ? 'rotate-y-180' : ''
              }`}>
                {/* Card Back */}
                <div className={`absolute inset-0 flex items-center justify-center bg-primary text-primary-foreground transition-opacity duration-300 ${
                  isCardFlipped(card.id) ? 'opacity-0' : 'opacity-100'
                }`}>
                  <div className="text-3xl">🇫🇷</div>
                </div>
                
                {/* Card Front */}
                <div className={`absolute inset-0 flex flex-col items-center justify-center p-2 transition-opacity duration-300 ${
                  isCardFlipped(card.id) ? 'opacity-100' : 'opacity-0'
                }`}>
                  <div className={`text-xs mb-1 ${
                    card.type === 'french' ? 'text-primary' : 'text-secondary'
                  }`}>
                    {card.type === 'french' ? 'FR' : 'EN'}
                  </div>
                  <div className="text-sm font-medium text-center leading-tight">
                    {card.content}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Game Controls */}
      <div className="flex justify-center mt-8 animate-fade-in">
        <Button variant="outline" onClick={initializeGame}>
          <RotateCcw className="w-4 h-4 mr-2" />
          New Game
        </Button>
      </div>
    </div>
  )
}