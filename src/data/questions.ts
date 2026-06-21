import type { Question, SubjectId } from '../types/game'

export const mathQuestionBank: Question[] = [
  // --- ADDITION (13 Questions) ---
  { id: 'add-1', equation: '5 + 3 = ?', subject: 'Mathematics', category: 'addition', choices: ['6', '7', '8', '9'], answerIndex: 2 },
  { id: 'add-2', equation: '12 + 7 = ?', subject: 'Mathematics', category: 'addition', choices: ['18', '19', '20', '21'], answerIndex: 1 },
  { id: 'add-3', equation: '25 + 14 = ?', subject: 'Mathematics', category: 'addition', choices: ['38', '39', '40', '41'], answerIndex: 1 },
  { id: 'add-4', equation: '8 + 9 = ?', subject: 'Mathematics', category: 'addition', choices: ['15', '16', '17', '18'], answerIndex: 2 },
  { id: 'add-5', equation: '34 + 18 = ?', subject: 'Mathematics', category: 'addition', choices: ['42', '52', '62', '50'], answerIndex: 1 },
  { id: 'add-6', equation: '15 + 15 = ?', subject: 'Mathematics', category: 'addition', choices: ['20', '25', '30', '35'], answerIndex: 2 },
  { id: 'add-7', equation: '47 + 6 = ?', subject: 'Mathematics', category: 'addition', choices: ['51', '52', '53', '54'], answerIndex: 2 },
  { id: 'add-8', equation: '58 + 23 = ?', subject: 'Mathematics', category: 'addition', choices: ['71', '81', '91', '82'], answerIndex: 1 },
  { id: 'add-9', equation: '9 + 14 = ?', subject: 'Mathematics', category: 'addition', choices: ['21', '22', '23', '24'], answerIndex: 2 },
  { id: 'add-10', equation: '60 + 25 = ?', subject: 'Mathematics', category: 'addition', choices: ['80', '85', '90', '75'], answerIndex: 1 },
  { id: 'add-11', equation: '18 + 13 = ?', subject: 'Mathematics', category: 'addition', choices: ['31', '32', '29', '30'], answerIndex: 0 },
  { id: 'add-12', equation: '75 + 15 = ?', subject: 'Mathematics', category: 'addition', choices: ['80', '85', '90', '95'], answerIndex: 2 },
  { id: 'add-13', equation: '39 + 42 = ?', subject: 'Mathematics', category: 'addition', choices: ['71', '81', '79', '83'], answerIndex: 1 },

  // --- SUBTRACTION (13 Questions) ---
  { id: 'sub-1', equation: '10 - 4 = ?', subject: 'Mathematics', category: 'subtraction', choices: ['5', '6', '7', '8'], answerIndex: 1 },
  { id: 'sub-2', equation: '25 - 9 = ?', subject: 'Mathematics', category: 'subtraction', choices: ['14', '15', '16', '17'], answerIndex: 2 },
  { id: 'sub-3', equation: '42 - 15 = ?', subject: 'Mathematics', category: 'subtraction', choices: ['27', '28', '29', '30'], answerIndex: 0 },
  { id: 'sub-4', equation: '18 - 12 = ?', subject: 'Mathematics', category: 'subtraction', choices: ['4', '5', '6', '7'], answerIndex: 2 },
  { id: 'sub-5', equation: '60 - 24 = ?', subject: 'Mathematics', category: 'subtraction', choices: ['34', '36', '46', '38'], answerIndex: 1 },
  { id: 'sub-6', equation: '83 - 40 = ?', subject: 'Mathematics', category: 'subtraction', choices: ['43', '33', '53', '40'], answerIndex: 0 },
  { id: 'sub-7', equation: '15 - 8 = ?', subject: 'Mathematics', category: 'subtraction', choices: ['5', '6', '7', '8'], answerIndex: 2 },
  { id: 'sub-8', equation: '91 - 13 = ?', subject: 'Mathematics', category: 'subtraction', choices: ['78', '88', '77', '82'], answerIndex: 0 },
  { id: 'sub-9', equation: '33 - 17 = ?', subject: 'Mathematics', category: 'subtraction', choices: ['14', '15', '16', '17'], answerIndex: 2 },
  { id: 'sub-10', equation: '50 - 25 = ?', subject: 'Mathematics', category: 'subtraction', choices: ['20', '25', '30', '35'], answerIndex: 1 },
  { id: 'sub-11', equation: '100 - 35 = ?', subject: 'Mathematics', category: 'subtraction', choices: ['55', '65', '75', '60'], answerIndex: 1 },
  { id: 'sub-12', equation: '74 - 28 = ?', subject: 'Mathematics', category: 'subtraction', choices: ['44', '46', '48', '56'], answerIndex: 1 },
  { id: 'sub-13', equation: '22 - 7 = ?', subject: 'Mathematics', category: 'subtraction', choices: ['13', '14', '15', '16'], answerIndex: 2 },

  // --- MULTIPLICATION (12 Questions) ---
  { id: 'mul-1', equation: '3 × 4 = ?', subject: 'Mathematics', category: 'multiplication', choices: ['10', '12', '14', '16'], answerIndex: 1 },
  { id: 'mul-2', equation: '6 × 5 = ?', subject: 'Mathematics', category: 'multiplication', choices: ['25', '30', '35', '40'], answerIndex: 1 },
  { id: 'mul-3', equation: '7 × 8 = ?', subject: 'Mathematics', category: 'multiplication', choices: ['54', '56', '58', '64'], answerIndex: 1 },
  { id: 'mul-4', equation: '9 × 3 = ?', subject: 'Mathematics', category: 'multiplication', choices: ['24', '27', '30', '33'], answerIndex: 1 },
  { id: 'mul-5', equation: '12 × 4 = ?', subject: 'Mathematics', category: 'multiplication', choices: ['44', '46', '48', '52'], answerIndex: 2 },
  { id: 'mul-6', equation: '8 × 4 = ?', subject: 'Mathematics', category: 'multiplication', choices: ['28', '32', '36', '40'], answerIndex: 1 },
  { id: 'mul-7', equation: '2 × 15 = ?', subject: 'Mathematics', category: 'multiplication', choices: ['25', '30', '35', '40'], answerIndex: 1 },
  { id: 'mul-8', equation: '7 × 7 = ?', subject: 'Mathematics', category: 'multiplication', choices: ['42', '47', '49', '56'], answerIndex: 2 },
  { id: 'mul-9', equation: '6 × 8 = ?', subject: 'Mathematics', category: 'multiplication', choices: ['42', '46', '48', '54'], answerIndex: 2 },
  { id: 'mul-10', equation: '11 × 9 = ?', subject: 'Mathematics', category: 'multiplication', choices: ['90', '99', '109', '100'], answerIndex: 1 },
  { id: 'mul-11', equation: '13 × 3 = ?', subject: 'Mathematics', category: 'multiplication', choices: ['36', '39', '42', '33'], answerIndex: 1 },
  { id: 'mul-12', equation: '5 × 12 = ?', subject: 'Mathematics', category: 'multiplication', choices: ['50', '55', '60', '65'], answerIndex: 2 },

  // --- DIVISION (12 Questions) ---
  { id: 'div-1', equation: '12 ÷ 3 = ?', subject: 'Mathematics', category: 'division', choices: ['3', '4', '5', '6'], answerIndex: 1 },
  { id: 'div-2', equation: '30 ÷ 5 = ?', subject: 'Mathematics', category: 'division', choices: ['5', '6', '7', '8'], answerIndex: 1 },
  { id: 'div-3', equation: '56 ÷ 8 = ?', subject: 'Mathematics', category: 'division', choices: ['6', '7', '8', '9'], answerIndex: 1 },
  { id: 'div-4', equation: '81 ÷ 9 = ?', subject: 'Mathematics', category: 'division', choices: ['7', '8', '9', '10'], answerIndex: 2 },
  { id: 'div-5', equation: '45 ÷ 5 = ?', subject: 'Mathematics', category: 'division', choices: ['7', '8', '9', '10'], answerIndex: 2 },
  { id: 'div-6', equation: '24 ÷ 4 = ?', subject: 'Mathematics', category: 'division', choices: ['5', '6', '7', '8'], answerIndex: 1 },
  { id: 'div-7', equation: '100 ÷ 10 = ?', subject: 'Mathematics', category: 'division', choices: ['5', '10', '15', '20'], answerIndex: 1 },
  { id: 'div-8', equation: '48 ÷ 6 = ?', subject: 'Mathematics', category: 'division', choices: ['6', '7', '8', '9'], answerIndex: 2 },
  { id: 'div-9', equation: '63 ÷ 7 = ?', subject: 'Mathematics', category: 'division', choices: ['7', '8', '9', '10'], answerIndex: 2 },
  { id: 'div-10', equation: '36 ÷ 12 = ?', subject: 'Mathematics', category: 'division', choices: ['2', '3', '4', '5'], answerIndex: 1 },
  { id: 'div-11', equation: '72 ÷ 8 = ?', subject: 'Mathematics', category: 'division', choices: ['7', '8', '9', '10'], answerIndex: 2 },
  { id: 'div-12', equation: '90 ÷ 9 = ?', subject: 'Mathematics', category: 'division', choices: ['8', '9', '10', '11'], answerIndex: 2 }
]

// Import other subject question banks
import { thaiQuestionBank } from './questions-thai'
import { englishQuestionBank } from './questions-english'

import { subjectRegistry } from './subjects'

/**
 * All question banks combined, indexed by subject.
 */
const allQuestionBanks: Record<SubjectId, Question[]> = {
  Mathematics: mathQuestionBank,
  Thai: thaiQuestionBank,
  English: englishQuestionBank,
  Science: [],
  Social: [],
}

/**
 * Get distinct categories for a subject and grade level from the offline bank.
 */
export const getSubjectCategories = (
  subject: SubjectId = 'Mathematics',
  gradeLevel: string = 'P1'
): { id: string; label: string; labelEn: string }[] => {
  const bank = allQuestionBanks[subject] || []
  
  const annotated = bank.map(q => {
    let fallbackGrade = 'P1'
    if (q.subject === 'Mathematics') {
      if (q.category === 'addition' || q.category === 'subtraction') fallbackGrade = 'P1'
      else if (q.category === 'multiplication') fallbackGrade = 'P2'
      else if (q.category === 'division') fallbackGrade = 'P3'
    }
    return { ...q, gradeLevel: q.gradeLevel || fallbackGrade }
  })

  const filtered = annotated.filter(q => q.gradeLevel === gradeLevel)
  const target = filtered.length > 0 ? filtered : annotated
  
  const distinctCategories = Array.from(new Set(target.map(q => q.category)))
  const config = subjectRegistry.find(s => s.id === subject)
  const categoryMap = new Map(config?.categories.map(c => [c.id, c]) || [])
  
  const results = distinctCategories.map(catId => {
    return categoryMap.get(catId) || { id: catId, label: catId, labelEn: catId }
  })

  const hasMixed = results.some(r => r.id === 'mixed')
  if (!hasMixed && results.length > 0) {
    return [
      { id: 'mixed', label: 'ผสมทุกเครื่องหมาย', labelEn: 'Mixed' },
      ...results
    ]
  }
  
  return results.length > 0 ? results : (config?.categories || [])
}

/**
 * Selects random questions for a given subject and optional category filter.
 * This is the main API for the game engine — it doesn't need to know subject internals.
 */
export const getSubjectQuestions = (
  subject: SubjectId = 'Mathematics',
  category: string = 'mixed',
  count: number = 5,
  gradeLevel: string = 'P1'
): Question[] => {
  const bank = allQuestionBanks[subject] || []

  // Assign fallback grade levels on the fly to avoid editing many lines of static data
  const annotatedBank = bank.map(q => {
    let fallbackGrade = 'P1'
    if (q.subject === 'Mathematics') {
      if (q.category === 'addition' || q.category === 'subtraction') fallbackGrade = 'P1'
      else if (q.category === 'multiplication') fallbackGrade = 'P2'
      else if (q.category === 'division') fallbackGrade = 'P3'
    }
    return { ...q, gradeLevel: q.gradeLevel || fallbackGrade }
  })

  // Filter by category and gradeLevel
  const filtered = annotatedBank.filter(q => {
    const matchCategory = category === 'mixed' || q.category === category
    const matchGrade = q.gradeLevel === gradeLevel
    return matchCategory && matchGrade
  })

  // If no match found for this specific grade, fallback to any categories to ensure gameplay works offline
  const finalFiltered = filtered.length > 0 ? filtered : annotatedBank.filter(q => category === 'mixed' || q.category === category)

  const shuffled = [...finalFiltered].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

/**
 * @deprecated Use getSubjectQuestions() instead. Kept for backward compatibility.
 */
export const getRandomQuestions = (
  count: number = 5,
  filter: string = 'mixed'
): Question[] => {
  return getSubjectQuestions('Mathematics', filter, count, 'P1')
}
