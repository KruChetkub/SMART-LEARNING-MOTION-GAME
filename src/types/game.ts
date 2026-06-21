// Subject definitions
export type SubjectId = 'Mathematics' | 'Thai' | 'English' | 'Science' | 'Social'

export interface SubjectConfig {
  id: SubjectId
  name: string           // ชื่อภาษาไทย
  nameEn: string         // ชื่อภาษาอังกฤษ
  icon: string           // emoji
  color: string          // tailwind gradient classes
  categories: { id: string; label: string; labelEn: string }[]
  active: boolean
}

export interface Question {
  id: string
  equation: string       // ใช้ได้กับทุกวิชา เช่น "5 + 3 = ?" หรือ "สระ อา อ่านว่า?"
  subject: SubjectId
  category: string       // เช่น 'addition', 'vowels', 'vocabulary'
  choices: string[]
  answerIndex?: number
  salt?: string
  correctHash?: number
  gradeLevel?: string
}

export type ScreenState = 'HOME' | 'GAME' | 'RESULT' | 'DASHBOARD' | 'ADMIN'

export interface AnswerRecord {
  questionId: string
  equation: string
  isCorrect: boolean
  selectedAnswer: string
  correctAnswer: string
  timeTaken: number // in seconds
}

export interface GameStats {
  totalScore: number
  correctCount: number
  wrongCount: number
  accuracy: number // percentage
  timeUsed: number // in seconds
  earnedBadge: string
  rank: string
  maxCombo: number
}

