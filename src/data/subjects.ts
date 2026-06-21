import type { SubjectConfig } from '../types/game'

/**
 * Central subject registry — single source of truth for all subjects.
 * To add a new subject, simply add a new entry here + create its question bank file.
 */
export const subjectRegistry: SubjectConfig[] = [
  {
    id: 'Mathematics',
    name: 'คณิตศาสตร์',
    nameEn: 'Mathematics',
    icon: '🔢',
    color: 'from-blue-500 to-cyan-500',
    active: true,
    categories: [
      { id: 'mixed', label: 'ผสมทุกเครื่องหมาย', labelEn: 'Mixed' },
      { id: 'addition', label: 'การบวก (+)', labelEn: 'Addition' },
      { id: 'subtraction', label: 'การลบ (-)', labelEn: 'Subtraction' },
      { id: 'multiplication', label: 'การคูณ (×)', labelEn: 'Multiplication' },
      { id: 'division', label: 'การหาร (÷)', labelEn: 'Division' },
    ]
  },
  {
    id: 'Thai',
    name: 'ภาษาไทย',
    nameEn: 'Thai Language',
    icon: '🇹🇭',
    color: 'from-orange-500 to-amber-500',
    active: true,
    categories: [
      { id: 'mixed', label: 'ผสมทุกหมวด', labelEn: 'Mixed' },
      { id: 'vowels', label: 'สระ', labelEn: 'Vowels' },
      { id: 'consonants', label: 'พยัญชนะ', labelEn: 'Consonants' },
      { id: 'reading', label: 'คำอ่าน', labelEn: 'Reading' },
      { id: 'vocabulary', label: 'คำศัพท์', labelEn: 'Vocabulary' },
    ]
  },
  {
    id: 'English',
    name: 'ภาษาอังกฤษ',
    nameEn: 'English',
    icon: '🌍',
    color: 'from-pink-500 to-rose-500',
    active: true,
    categories: [
      { id: 'mixed', label: 'ผสมทุกหมวด', labelEn: 'Mixed' },
      { id: 'vocabulary', label: 'คำศัพท์', labelEn: 'Vocabulary' },
      { id: 'grammar', label: 'ไวยากรณ์', labelEn: 'Grammar' },
      { id: 'spelling', label: 'การสะกดคำ', labelEn: 'Spelling' },
      { id: 'reading', label: 'การอ่าน', labelEn: 'Reading' },
    ]
  },
  {
    id: 'Science',
    name: 'วิทยาศาสตร์',
    nameEn: 'Science',
    icon: '🔬',
    color: 'from-green-500 to-emerald-500',
    active: false,
    categories: [
      { id: 'mixed', label: 'ผสมทุกหมวด', labelEn: 'Mixed' },
    ]
  },
  {
    id: 'Social',
    name: 'สังคมศึกษา',
    nameEn: 'Social Studies',
    icon: '🏛️',
    color: 'from-purple-500 to-violet-500',
    active: false,
    categories: [
      { id: 'mixed', label: 'ผสมทุกหมวด', labelEn: 'Mixed' },
    ]
  },
]

/**
 * Get a subject config by ID.
 */
export const getSubjectConfig = (id: string): SubjectConfig | undefined => {
  return subjectRegistry.find(s => s.id === id)
}
