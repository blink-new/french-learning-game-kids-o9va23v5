export interface WordPair {
  id: string
  french: string
  english: string
  category: string
  difficulty: number
}

export interface GameProgress {
  id: string
  userId: string
  level: number
  score: number
  wordsLearned: string[]
  achievements: string[]
  createdAt: Date
  updatedAt: Date
}

export interface GameSession {
  id: string
  userId: string
  gameType: 'vocabulary' | 'memory' | 'pronunciation'
  score: number
  correctAnswers: number
  totalQuestions: number
  timeSpent: number
  completedAt: Date
}