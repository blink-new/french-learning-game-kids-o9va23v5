import { WordPair } from '../types/game'

export const vocabularyData: WordPair[] = [
  // Animals - Level 1
  { id: '1', french: 'chat', english: 'cat', category: 'animals', difficulty: 1 },
  { id: '2', french: 'chien', english: 'dog', category: 'animals', difficulty: 1 },
  { id: '3', french: 'oiseau', english: 'bird', category: 'animals', difficulty: 1 },
  { id: '4', french: 'poisson', english: 'fish', category: 'animals', difficulty: 1 },
  { id: '5', french: 'lapin', english: 'rabbit', category: 'animals', difficulty: 1 },
  
  // Colors - Level 1
  { id: '6', french: 'rouge', english: 'red', category: 'colors', difficulty: 1 },
  { id: '7', french: 'bleu', english: 'blue', category: 'colors', difficulty: 1 },
  { id: '8', french: 'vert', english: 'green', category: 'colors', difficulty: 1 },
  { id: '9', french: 'jaune', english: 'yellow', category: 'colors', difficulty: 1 },
  { id: '10', french: 'noir', english: 'black', category: 'colors', difficulty: 1 },
  
  // Numbers - Level 1
  { id: '11', french: 'un', english: 'one', category: 'numbers', difficulty: 1 },
  { id: '12', french: 'deux', english: 'two', category: 'numbers', difficulty: 1 },
  { id: '13', french: 'trois', english: 'three', category: 'numbers', difficulty: 1 },
  { id: '14', french: 'quatre', english: 'four', category: 'numbers', difficulty: 1 },
  { id: '15', french: 'cinq', english: 'five', category: 'numbers', difficulty: 1 },
  
  // Food - Level 2
  { id: '16', french: 'pomme', english: 'apple', category: 'food', difficulty: 2 },
  { id: '17', french: 'pain', english: 'bread', category: 'food', difficulty: 2 },
  { id: '18', french: 'eau', english: 'water', category: 'food', difficulty: 2 },
  { id: '19', french: 'lait', english: 'milk', category: 'food', difficulty: 2 },
  { id: '20', french: 'fromage', english: 'cheese', category: 'food', difficulty: 2 },
  
  // Family - Level 2
  { id: '21', french: 'maman', english: 'mom', category: 'family', difficulty: 2 },
  { id: '22', french: 'papa', english: 'dad', category: 'family', difficulty: 2 },
  { id: '23', french: 'frère', english: 'brother', category: 'family', difficulty: 2 },
  { id: '24', french: 'sœur', english: 'sister', category: 'family', difficulty: 2 },
  { id: '25', french: 'grand-mère', english: 'grandmother', category: 'family', difficulty: 2 },
]

export const getWordsByDifficulty = (difficulty: number): WordPair[] => {
  return vocabularyData.filter(word => word.difficulty === difficulty)
}

export const getWordsByCategory = (category: string): WordPair[] => {
  return vocabularyData.filter(word => word.category === category)
}

export const getRandomWords = (count: number, difficulty?: number): WordPair[] => {
  const words = difficulty ? getWordsByDifficulty(difficulty) : vocabularyData
  const shuffled = [...words].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}