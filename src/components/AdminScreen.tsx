import React, { useState, useEffect } from 'react'
import { Plus, Trash2, ArrowLeft, Settings, Save, ShieldAlert, Sparkles, BookOpen, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { SubjectId, Question } from '../types/game'
import { DashboardScreen } from './DashboardScreen'
import * as XLSX from 'xlsx'

interface AdminScreenProps {
  subjects: any[]
  grades: any[]
  onGoHome: () => void
  onRefreshSettings: () => void
}

export const AdminScreen: React.FC<AdminScreenProps> = ({ subjects, grades, onGoHome, onRefreshSettings }) => {
  const [activeTab, setActiveTab] = useState<'questions' | 'settings' | 'analytics' | 'subjects_grades'>('questions')
  const [selectedSubject, setSelectedSubject] = useState<SubjectId>('Mathematics')
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<string>('P1')
  const [settingsGradeLevel, setSettingsGradeLevel] = useState<string>('P1')
  const [questions, setQuestions] = useState<Question[]>([])
  
  // Form states for new question
  const [newSubject, setNewSubject] = useState<SubjectId>('Mathematics')
  const [newGradeLevel, setNewGradeLevel] = useState<string>('P1')
  const [newCategory, setNewCategory] = useState<string>('mixed')
  const [newEquation, setNewEquation] = useState<string>('')
  const [choiceA, setChoiceA] = useState<string>('')
  const [choiceB, setChoiceB] = useState<string>('')
  const [choiceC, setChoiceC] = useState<string>('')
  const [choiceD, setChoiceD] = useState<string>('')
  const [newAnswerIndex, setNewAnswerIndex] = useState<number>(0)
  
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  // Game configuration states (dynamic lookup map)
  const [dynamicSettings, setDynamicSettings] = useState<Record<string, { timeLimit: number; questionsPerGame: number }>>({})
  const [configSuccess, setConfigSuccess] = useState<string | null>(null)
  
  // Season Reset States
  const [resetLoading, setResetLoading] = useState<boolean>(false)
  const [resetSuccess, setResetSuccess] = useState<string | null>(null)

  // Manage subjects and grades state variables
  const [subFormId, setSubFormId] = useState('')
  const [subFormName, setSubFormName] = useState('')
  const [subFormNameEn, setSubFormNameEn] = useState('')
  const [subFormIcon, setSubFormIcon] = useState('📚')
  const [subFormColor, setSubFormColor] = useState('from-blue-500 to-cyan-500')
  const [subFormCategories, setSubFormCategories] = useState('[{"id": "mixed", "label": "ผสมทุกหมวด", "labelEn": "Mixed"}]')
  const [subFormAllowedGrades, setSubFormAllowedGrades] = useState<string[]>([])
  const [subFormIsActive, setSubFormIsActive] = useState(true)

  const [gradeFormId, setGradeFormId] = useState('')
  const [gradeFormLabel, setGradeFormLabel] = useState('')
  const [gradeFormName, setGradeFormName] = useState('')

  const [subError, setSubError] = useState<string | null>(null)
  const [subSuccess, setSubSuccess] = useState<string | null>(null)

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubError(null)
    setSubSuccess(null)

    if (!subFormId || !subFormName || !subFormNameEn) {
      setSubError('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (รหัสวิชา, ชื่อภาษาไทย, ชื่อภาษาอังกฤษ)')
      return
    }

    try {
      let parsedCategories = []
      try {
        parsedCategories = JSON.parse(subFormCategories)
      } catch (err) {
        setSubError('รูปแบบหมวดหมู่คำถาม (Categories JSON) ไม่ถูกต้อง ตัวอย่างที่ถูกต้อง: [{"id": "mixed", "label": "ผสม"}]')
        return
      }

      const { error } = await supabase
        .from('subjects')
        .upsert({
          id: subFormId.trim(),
          name: subFormName.trim(),
          name_en: subFormNameEn.trim(),
          icon: subFormIcon.trim(),
          color: subFormColor.trim(),
          categories: parsedCategories,
          allowed_grades: subFormAllowedGrades,
          is_active: subFormIsActive
        })

      if (error) throw error

      setSubSuccess('บันทึกข้อมูลวิชาเรียบร้อยแล้ว!')
      onRefreshSettings()
      
      setSubFormId('')
      setSubFormName('')
      setSubFormNameEn('')
      setSubFormIcon('📚')
      setSubFormColor('from-blue-500 to-cyan-500')
      setSubFormCategories('[{"id": "mixed", "label": "ผสมทุกหมวด", "labelEn": "Mixed"}]')
    } catch (err: any) {
      console.error(err)
      setSubError('เกิดข้อผิดพลาดในการบันทึก: ' + err.message)
    }
  }

  const handleDeleteSubject = async (subjectId: string) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบวิชา "${subjectId}"? การลบนี้จะไม่ลบข้อสอบที่มีอยู่ แต่หัวข้อวิชานี้จะหายไปจากตัวกรอง`)) {
      return
    }
    setSubError(null)
    setSubSuccess(null)

    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', subjectId)

      if (error) throw error

      setSubSuccess('ลบวิชาเรียบร้อยแล้ว!')
      onRefreshSettings()
    } catch (err: any) {
      console.error(err)
      setSubError('เกิดข้อผิดพลาดในการลบ: ' + err.message)
    }
  }

  const handleAddGrade = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubError(null)
    setSubSuccess(null)

    if (!gradeFormId || !gradeFormLabel || !gradeFormName) {
      setSubError('กรุณากรอกข้อมูลระดับชั้นให้ครบถ้วน')
      return
    }

    try {
      const { error } = await supabase
        .from('grades')
        .upsert({
          id: gradeFormId.trim(),
          label: gradeFormLabel.trim(),
          name: gradeFormName.trim()
        })

      if (error) throw error

      setSubSuccess('บันทึกข้อมูลระดับชั้นเรียนเรียบร้อยแล้ว!')
      onRefreshSettings()

      setGradeFormId('')
      setGradeFormLabel('')
      setGradeFormName('')
    } catch (err: any) {
      console.error(err)
      setSubError('เกิดข้อผิดพลาดในการบันทึกระดับชั้น: ' + err.message)
    }
  }

  const handleDeleteGrade = async (gradeId: string) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบระดับชั้น "${gradeId}"?`)) {
      return
    }
    setSubError(null)
    setSubSuccess(null)

    try {
      const { error } = await supabase
        .from('grades')
        .delete()
        .eq('id', gradeId)

      if (error) throw error

      setSubSuccess('ลบระดับชั้นเรียนเรียบร้อยแล้ว!')
      onRefreshSettings()
    } catch (err: any) {
      console.error(err)
      setSubError('เกิดข้อผิดพลาดในการลบระดับชั้น: ' + err.message)
    }
  }

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('subject', selectedSubject)
        .eq('grade_level', selectedGradeLevel)
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        setQuestions(data.map(q => ({
          id: q.id,
          subject: q.subject as SubjectId,
          category: q.category,
          equation: q.equation,
          choices: q.choices,
          answerIndex: q.answer_index,
          gradeLevel: q.grade_level
        })))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchSettings = async (grade: string) => {
    try {
      const { data, error } = await supabase
        .from('game_settings')
        .select('*')
        .eq('grade_level', grade)
      
      const initialMap: Record<string, { timeLimit: number; questionsPerGame: number }> = {}
      subjects.forEach(sub => {
        initialMap[sub.id] = { timeLimit: 15, questionsPerGame: 5 }
      })

      if (!error && data) {
        data.forEach(item => {
          initialMap[item.subject] = {
            timeLimit: item.time_limit,
            questionsPerGame: item.questions_per_game
          }
        })
      }
      setDynamicSettings(initialMap)
    } catch (e) {
      console.error(e)
    }
  }

  // Auto reset selection states to safe dynamic values if current values are invalid
  useEffect(() => {
    if (subjects.length > 0) {
      const isSubValid = subjects.some(s => s.id === selectedSubject)
      if (!isSubValid) {
        setSelectedSubject(subjects[0].id)
      }
      const isNewSubValid = subjects.some(s => s.id === newSubject)
      if (!isNewSubValid) {
        setNewSubject(subjects[0].id)
      }
    }
  }, [subjects, selectedSubject, newSubject])

  useEffect(() => {
    if (grades.length > 0) {
      const isGradeValid = grades.some(g => g.id === selectedGradeLevel)
      if (!isGradeValid) {
        setSelectedGradeLevel(grades[0].id)
      }
      const isNewGradeValid = grades.some(g => g.id === newGradeLevel)
      if (!isNewGradeValid) {
        setNewGradeLevel(grades[0].id)
      }
      const isSettingGradeValid = grades.some(g => g.id === settingsGradeLevel)
      if (!isSettingGradeValid) {
        setSettingsGradeLevel(grades[0].id)
      }
    }
  }, [grades, selectedGradeLevel, newGradeLevel, settingsGradeLevel])

  useEffect(() => {
    fetchQuestions()
  }, [selectedSubject, selectedGradeLevel])

  useEffect(() => {
    fetchSettings(settingsGradeLevel)
  }, [settingsGradeLevel, subjects])

  // CSV import states & handlers
  const [csvError, setCsvError] = useState<string | null>(null)
  const [csvSuccess, setCsvSuccess] = useState<string | null>(null)
  const [csvLoading, setCsvLoading] = useState<boolean>(false)

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    
    return result.map(val => val.replace(/^"|"$/g, '').replace(/""/g, '"'))
  }

  const processImportRows = async (rows: string[][]) => {
    const parsedQuestions: any[] = []
    let skippedHeader = false

    for (let i = 0; i < rows.length; i++) {
      const columns = rows[i]
      if (!columns || columns.length === 0 || (columns.length === 1 && !columns[0])) continue

      // Skip header row if columns match headers
      if (!skippedHeader && (columns[0]?.toString().toLowerCase() === 'subject' || columns[3]?.toString().toLowerCase() === 'equation')) {
        skippedHeader = true
        continue
      }

      if (columns.length < 9) {
        throw new Error(`แถวที่ ${i + 1}: ข้อมูลไม่ครบถ้วน (ต้องมีอย่างน้อย 9 คอลัมน์)`)
      }

      const subject = columns[0]?.toString().trim()
      const gradeLevel = columns[1]?.toString().trim()
      const category = columns[2]?.toString().trim()
      const equation = columns[3]?.toString().trim()
      const choice1 = columns[4]?.toString().trim()
      const choice2 = columns[5]?.toString().trim()
      const choice3 = columns[6]?.toString().trim()
      const choice4 = columns[7]?.toString().trim()
      const answerIndexRaw = columns[8]?.toString().trim()

      if (!['Mathematics', 'Thai', 'English'].includes(subject)) {
        throw new Error(`แถวที่ ${i + 1}: ชื่อวิชาไม่ถูกต้อง (ต้องเป็น Mathematics, Thai, หรือ English เท่านั้น)`)
      }

      const validGrades = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6']
      if (!validGrades.includes(gradeLevel)) {
        throw new Error(`แถวที่ ${i + 1}: ระดับชั้นเรียนไม่ถูกต้อง (ต้องเป็น P1-P6 หรือ M1-M6 เท่านั้น)`)
      }

      if (!category || !equation || !choice1 || !choice2 || !choice3 || !choice4) {
        throw new Error(`แถวที่ ${i + 1}: ข้อมูลต้องไม่เป็นค่าว่าง`)
      }

      const choices = [choice1, choice2, choice3, choice4]
      const uniqueChoices = new Set(choices)
      if (uniqueChoices.size !== 4) {
        throw new Error(`แถวที่ ${i + 1}: ตัวเลือกคำตอบทั้ง 4 ข้อต้องห้ามซ้ำกัน`)
      }

      const answerIndex = parseInt(answerIndexRaw, 10) - 1
      if (isNaN(answerIndex) || answerIndex < 0 || answerIndex > 3) {
        throw new Error(`แถวที่ ${i + 1}: เฉลย (answer_index) ต้องเป็นตัวเลขระบุตัวเลือกที่ถูกต้องระหว่าง 1 ถึง 4 (1=ตัวเลือก 1, 2=ตัวเลือก 2, 3=ตัวเลือก 3, 4=ตัวเลือก 4)`)
      }

      parsedQuestions.push({
        subject,
        grade_level: gradeLevel,
        category: category.toLowerCase(),
        equation,
        choices,
        answer_index: answerIndex
      })
    }

    if (parsedQuestions.length === 0) {
      throw new Error('ไม่พบคำถามที่สามารถนำเข้าได้ในไฟล์นี้')
    }

    const { error } = await supabase
      .from('questions')
      .insert(parsedQuestions)

    if (error) {
      throw new Error(`เกิดข้อผิดพลาดในการบันทึก: ${error.message}`)
    }

    return parsedQuestions.length
  }

  const handleCSVImport = async (text: string) => {
    setCsvError(null)
    setCsvSuccess(null)
    setCsvLoading(true)

    try {
      const lines = text.split(/\r?\n/)
      if (lines.length === 0) {
        setCsvError('ไฟล์ CSV ไม่มีข้อมูล')
        setCsvLoading(false)
        return
      }

      const rows: string[][] = []
      for (const line of lines) {
        if (line.trim()) {
          rows.push(parseCSVLine(line))
        }
      }

      const count = await processImportRows(rows)
      setCsvSuccess(`นำเข้าข้อสอบใหม่สำเร็จทั้งหมด ${count} ข้อ!`)
      fetchQuestions()
    } catch (err: any) {
      setCsvError(err.message || `เกิดข้อผิดพลาดในการประมวลผลไฟล์`)
    } finally {
      setCsvLoading(false)
    }
  }

  const handleExcelImport = async (arrayBuffer: ArrayBuffer) => {
    setCsvError(null)
    setCsvSuccess(null)
    setCsvLoading(true)

    try {
      const data = new Uint8Array(arrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      
      const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 })
      
      const stringRows: string[][] = rows.map(row => 
        (Array.isArray(row) ? row : []).map(val => val !== undefined && val !== null ? val.toString() : '')
      )

      const count = await processImportRows(stringRows)
      setCsvSuccess(`นำเข้าข้อสอบใหม่จาก Excel สำเร็จทั้งหมด ${count} ข้อ!`)
      fetchQuestions()
    } catch (err: any) {
      setCsvError(err.message || `เกิดข้อผิดพลาดในการประมวลผลไฟล์ Excel`)
    } finally {
      setCsvLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const fileName = file.name.toLowerCase()
    if (fileName.endsWith('.csv')) {
      const reader = new FileReader()
      reader.onload = (evt) => {
        const text = evt.target?.result as string
        if (text) {
          handleCSVImport(text)
        }
      }
      reader.readAsText(file, 'UTF-8')
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader()
      reader.onload = (evt) => {
        const buffer = evt.target?.result as ArrayBuffer
        if (buffer) {
          handleExcelImport(buffer)
        }
      }
      reader.readAsArrayBuffer(file)
    } else {
      setCsvError('ฟอร์แมตไฟล์ไม่ถูกต้อง กรุณาอัปโหลดไฟล์ .csv หรือ .xlsx เท่านั้น')
    }
    
    // Clear input
    e.target.value = ''
  }

  const downloadCSVTemplate = () => {
    const csvContent = "\ufeff" + // BOM for Excel UTF-8 display compatibility
      "subject,grade_level,category,equation,choice_1,choice_2,choice_3,choice_4,answer_index\r\n" +
      "Mathematics,P1,addition,5 + 3 = ?,6,7,8,9,3\r\n" +
      "Thai,P1,vocabulary,คำตรงข้ามของ 'มืด' คือ?,สว่าง,ขาว,ร้อน,เย็น,1\r\n" +
      "English,M1,vocabulary,What is the opposite of 'hot'?,cold,warm,cool,ice,1\r\n";
      
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "smart_math_question_template.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setFormSuccess(null)

    // Validation
    if (!newEquation.trim() || !choiceA.trim() || !choiceB.trim() || !choiceC.trim() || !choiceD.trim()) {
      setFormError('กรุณากรอกข้อมูลโจทย์และตัวเลือกให้ครบทุกช่อง')
      return
    }

    const choices = [choiceA.trim(), choiceB.trim(), choiceC.trim(), choiceD.trim()]
    
    // Check for duplicate choices (Client-Side Check)
    const uniqueChoices = new Set(choices)
    if (uniqueChoices.size !== 4) {
      setFormError('ข้อห้าม: ตัวเลือกคำตอบทั้ง 4 ช่องห้ามซ้ำกันเด็ดขาด!')
      return
    }

    try {
      const { error } = await supabase
        .from('questions')
        .insert({
          subject: newSubject,
          grade_level: newGradeLevel,
          category: newCategory.trim().toLowerCase(),
          equation: newEquation.trim(),
          choices,
          answer_index: newAnswerIndex
        })

      if (error) {
        setFormError(`เกิดข้อผิดพลาดในการบันทึก: ${error.message}`)
      } else {
        setFormSuccess('บันทึกคำถามลงคลังเรียบร้อยแล้ว!')
        // Reset form
        setNewEquation('')
        setChoiceA('')
        setChoiceB('')
        setChoiceC('')
        setChoiceD('')
        setNewAnswerIndex(0)
        fetchQuestions()
      }
    } catch (e) {
      setFormError('ไม่สามารถบันทึกข้อมูลได้')
    }
  }

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบคำถามข้อนี้ออกจากคลังข้อสอบ?')) return
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id)
      
      if (!error) {
        fetchQuestions()
      } else {
        alert(`เกิดข้อผิดพลาดในการลบ: ${error.message}`)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setConfigSuccess(null)
    try {
      const updates = Object.entries(dynamicSettings).map(([subId, setting]) => ({
        subject: subId,
        grade_level: settingsGradeLevel,
        time_limit: setting.timeLimit,
        questions_per_game: setting.questionsPerGame
      }))

      for (const update of updates) {
        const { error } = await supabase
          .from('game_settings')
          .upsert(update, { onConflict: 'subject,grade_level' })
        if (error) throw error
      }

      setConfigSuccess(`อัปเดตการตั้งค่าระดับชั้น ${settingsGradeLevel} เรียบร้อยแล้ว!`)
      onRefreshSettings()
    } catch (e: any) {
      alert('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า: ' + e.message)
    }
  }

  const handleResetMonthlyRanks = async () => {
    if (!confirm('คำเตือน: นี่คือการล้างค่าระดับแร้งกิ้งของผู้เล่นทุกคนในระบบ (จะลดแรงค์ลง 1 ระดับและล้างดาวเควสทั้งหมดเพื่อรับซีซั่นใหม่) คุณแน่ใจหรือไม่?')) return
    setResetLoading(true)
    setResetSuccess(null)
    try {
      const { error } = await supabase.rpc('reset_monthly_ranks')
      if (error) {
        alert(`เกิดข้อผิดพลาดในการรีเซ็ต: ${error.message}`)
      } else {
        setResetSuccess('ทำการรีเซ็ตระดับแร้งกิ้งสำหรับต้อนรับฤดูกาลใหม่เรียบร้อยแล้ว!')
      }
    } catch (e: any) {
      alert(`ไม่สามารถเชื่อมต่อระบบหลังบ้านได้: ${e.message || e}`)
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 flex flex-col min-h-[85svh]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onGoHome}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-slate-300" />
          </button>
          <div>
            <h1 className="text-2xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-amber-500 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-red-500" />
              จัดการระบบคำถาม (Admin Console)
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Database Questions bank & Dynamic Config Panel</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 rounded-xl bg-white/5 border border-white/10 mb-6 w-fit select-none flex-wrap">
        <button
          onClick={() => setActiveTab('questions')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === 'questions'
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          📝 จัดการคลังข้อสอบ
        </button>
        <button
          onClick={() => setActiveTab('subjects_grades')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === 'subjects_grades'
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          📚 จัดการวิชาและชั้นเรียน
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          ⚙️ ตั้งค่าความเร็ว & ข้อ
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          📊 แดชบอร์ดวิเคราะห์ผล
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 w-full">
        {activeTab === 'questions' ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6 items-start">
            {/* Left: Questions List */}
            <div className="glass-panel p-5 rounded-2xl border-slate-700/50 flex flex-col gap-4 text-left">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <h3 className="font-bold text-white flex items-center gap-2 text-sm sm:text-base">
                  <BookOpen className="w-5 h-5 text-secondary" />
                  รายการคำถามในฐานข้อมูล
                </h3>
                {/* Subject Selector */}
                <div className="flex gap-2">
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1 text-xs outline-none cursor-pointer"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.nameEn})</option>
                    ))}
                  </select>
                  <select
                    value={selectedGradeLevel}
                    onChange={(e) => setSelectedGradeLevel(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1 text-xs outline-none cursor-pointer"
                  >
                    {grades.map(g => (
                      <option key={g.id} value={g.id}>{g.id}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Questions Render */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {questions.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-10">ยังไม่มีโจทย์วิชานี้ในฐานข้อมูลหลังบ้าน</p>
                ) : (
                  questions.map((q) => (
                    <div key={q.id} className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 text-[10px]">
                          <span className="bg-red-950/50 border border-red-900/50 text-red-400 font-bold px-1.5 py-0.5 rounded uppercase">{q.category}</span>
                        </div>
                        <h4 className="font-semibold text-xs sm:text-sm text-white mb-2 leading-relaxed">{q.equation}</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          {q.choices.map((c, i) => (
                            <span
                              key={i}
                              className={`text-[10px] px-2 py-1 rounded truncate text-center font-medium ${
                                i === q.answerIndex
                                  ? 'bg-success/20 border border-success/40 text-success'
                                  : 'bg-slate-900/40 border border-slate-800 text-slate-400'
                              }`}
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="w-8 h-8 rounded-lg bg-red-950/40 border border-red-900/30 flex items-center justify-center text-red-400 hover:bg-red-900/50 hover:text-white transition-all cursor-pointer"
                        title="ลบข้อสอบ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: Add Question Form & CSV Import */}
            <div className="flex flex-col gap-6 w-full">
              {/* Manual Form */}
              <div className="glass-panel p-5 rounded-2xl border-slate-700/50 flex flex-col gap-4 text-left">
                <h3 className="font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800 text-sm sm:text-base">
                  <Plus className="w-5 h-5 text-success" />
                  เพิ่มโจทย์ใหม่เข้าสู่คลังข้อสอบ
                </h3>

                <form onSubmit={handleAddQuestion} className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">วิชา (Subject)</label>
                      <select
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none"
                      >
                        {subjects.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">ระดับชั้น (Grade)</label>
                      <select
                        value={newGradeLevel}
                        onChange={(e) => setNewGradeLevel(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none"
                      >
                        {grades.map(g => (
                          <option key={g.id} value={g.id}>{g.id}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">หมวดหมู่ (Category)</label>
                      <input
                        type="text"
                        placeholder="เช่น vocabulary, addition"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">คำถาม/โจทย์ (Equation/Question Text)</label>
                    <textarea
                      placeholder="ป้อนคำถาม เช่น คำตรงข้ามของ 'มืด' คือ? หรือ 8 x 4 = ?"
                      value={newEquation}
                      onChange={(e) => setNewEquation(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none h-16 resize-none"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">ตัวเลือกคำตอบ 4 ช่อง (ต้องไม่ซ้ำกัน)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 bg-slate-950 border border-slate-850 px-2 rounded-lg">
                        <span className="text-[10px] font-black text-slate-500">A:</span>
                        <input
                          type="text"
                          placeholder="ตัวเลือก A"
                          value={choiceA}
                          onChange={(e) => setChoiceA(e.target.value)}
                          className="w-full bg-transparent p-2 text-xs text-white outline-none"
                          required
                        />
                      </div>
                      <div className="flex items-center gap-2 bg-slate-950 border border-slate-850 px-2 rounded-lg">
                        <span className="text-[10px] font-black text-slate-500">B:</span>
                        <input
                          type="text"
                          placeholder="ตัวเลือก B"
                          value={choiceB}
                          onChange={(e) => setChoiceB(e.target.value)}
                          className="w-full bg-transparent p-2 text-xs text-white outline-none"
                          required
                        />
                      </div>
                      <div className="flex items-center gap-2 bg-slate-950 border border-slate-850 px-2 rounded-lg">
                        <span className="text-[10px] font-black text-slate-500">C:</span>
                        <input
                          type="text"
                          placeholder="ตัวเลือก C"
                          value={choiceC}
                          onChange={(e) => setChoiceC(e.target.value)}
                          className="w-full bg-transparent p-2 text-xs text-white outline-none"
                          required
                        />
                      </div>
                      <div className="flex items-center gap-2 bg-slate-950 border border-slate-850 px-2 rounded-lg">
                        <span className="text-[10px] font-black text-slate-500">D:</span>
                        <input
                          type="text"
                          placeholder="ตัวเลือก D"
                          value={choiceD}
                          onChange={(e) => setChoiceD(e.target.value)}
                          className="w-full bg-transparent p-2 text-xs text-white outline-none"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">คำตอบที่ถูกต้อง (Correct Choice)</label>
                    <select
                      value={newAnswerIndex}
                      onChange={(e) => setNewAnswerIndex(parseInt(e.target.value, 10))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none"
                    >
                      <option value={0}>ตัวเลือก A {choiceA ? `(${choiceA})` : ''}</option>
                      <option value={1}>ตัวเลือก B {choiceB ? `(${choiceB})` : ''}</option>
                      <option value={2}>ตัวเลือก C {choiceC ? `(${choiceC})` : ''}</option>
                      <option value={3}>ตัวเลือก D {choiceD ? `(${choiceD})` : ''}</option>
                    </select>
                  </div>

                  {formError && (
                    <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-400 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {formSuccess && (
                    <div className="p-3 bg-green-950/20 border border-green-900/30 text-green-400 text-xs rounded-xl flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-green-500 shrink-0" />
                      <span>{formSuccess}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-red-600/15 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 fill-white" />
                    เพิ่มข้อสอบลงฐานข้อมูล
                  </button>
                </form>
              </div>

              {/* CSV Bulk Import */}
              <div className="glass-panel p-5 rounded-2xl border-slate-700/50 flex flex-col gap-4 text-left">
                <h3 className="font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800 text-sm sm:text-base">
                  📁 นำเข้าข้อสอบชุดใหญ่ (Bulk CSV / Excel Import)
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  นำเข้าข้อสอบพร้อมกันหลายข้อโดยใช้ไฟล์ CSV หรือ Excel (.xlsx / .xls) ตัวอย่างหัวข้อคอลัมน์ในไฟล์:
                  <code className="block bg-slate-950 p-2 rounded mt-1.5 font-mono text-[9px] text-amber-400 overflow-x-auto whitespace-nowrap">
                    subject,category,equation,choice_1,choice_2,choice_3,choice_4,answer_index
                  </code>
                </p>

                <button
                  type="button"
                  onClick={downloadCSVTemplate}
                  className="py-2 px-3 text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-350 hover:text-white rounded-lg flex items-center justify-center gap-1.5 w-fit border border-slate-800 hover:border-slate-700 transition-all cursor-pointer select-none font-bold"
                >
                  📥 ดาวน์โหลดไฟล์แม่แบบ CSV (Download CSV Template)
                </button>

                <div className="mt-2 space-y-3">
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-red-500/50 rounded-xl p-6 cursor-pointer bg-slate-950/40 hover:bg-slate-950/70 transition-all select-none">
                    <span className="text-[11px] font-bold text-slate-300 hover:text-white text-center">
                      {csvLoading ? 'กำลังนำเข้าข้อสอบ...' : '📂 คลิกที่นี่เพื่อเลือกไฟล์ .csv หรือ .xlsx'}
                    </span>
                    <input
                      type="file"
                      accept=".csv, .xlsx, .xls"
                      disabled={csvLoading}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  {csvError && (
                    <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-400 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <span>{csvError}</span>
                    </div>
                  )}

                  {csvSuccess && (
                    <div className="p-3 bg-green-950/20 border border-green-900/30 text-green-400 text-xs rounded-xl flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-green-500 shrink-0" />
                      <span>{csvSuccess}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'settings' ? (
          /* Game Configurations Tab */
          <div className="max-w-2xl mx-auto glass-panel p-6 rounded-2xl border-slate-700/50 text-left">
            <h3 className="font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800 text-sm sm:text-base mb-6">
              <Settings className="w-5 h-5 text-secondary animate-spin [animation-duration:15s]" />
              ตั้งค่าพารามิเตอร์การเล่นเกม
            </h3>

            {/* Settings Grade Level Selector */}
            <div className="mb-6 p-4 bg-slate-950/40 border border-slate-850 rounded-xl">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">เลือกระดับชั้นเรียนเพื่อตั้งค่า (Configure Grade Level)</label>
              <select
                value={settingsGradeLevel}
                onChange={(e) => setSettingsGradeLevel(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2.5 text-xs outline-none cursor-pointer"
              >
                {grades.map(g => (
                  <option key={g.id} value={g.id}>{g.label}</option>
                ))}
              </select>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {subjects.map(sub => {
                const setting = dynamicSettings[sub.id] || { timeLimit: 15, questionsPerGame: 5 }
                return (
                  <div key={sub.id} className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl">
                    <h4 className="font-bold text-xs text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <span className="text-base">{sub.icon}</span> {sub.name} (วิชา{sub.nameEn})
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold mb-1">เวลานับถอยหลังต่อข้อ (วินาที)</label>
                        <select
                          value={setting.timeLimit}
                          onChange={(e) => {
                            setDynamicSettings(prev => ({
                              ...prev,
                              [sub.id]: { ...setting, timeLimit: parseInt(e.target.value, 10) }
                            }))
                          }}
                          className="w-full bg-slate-900 border border-slate-780 rounded-lg p-2.5 text-xs text-white"
                        >
                          <option value={15}>15 วินาที</option>
                          <option value={30}>30 วินาที</option>
                          <option value={60}>60 วินาที (1 นาที)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold mb-1">จำนวนข้อต่อหนึ่งเกม (คำถาม)</label>
                        <select
                          value={setting.questionsPerGame}
                          onChange={(e) => {
                            setDynamicSettings(prev => ({
                              ...prev,
                              [sub.id]: { ...setting, questionsPerGame: parseInt(e.target.value, 10) }
                            }))
                          }}
                          className="w-full bg-slate-900 border border-slate-780 rounded-lg p-2.5 text-xs text-white"
                        >
                          <option value={5}>5 ข้อ</option>
                          <option value={10}>10 ข้อ</option>
                          <option value={20}>20 ข้อ</option>
                          <option value={50}>50 ข้อ</option>
                          <option value={100}>100 ข้อ</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )
              })}

              {configSuccess && (
                <div className="p-3 bg-green-950/20 border border-green-900/30 text-green-400 text-xs rounded-xl flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-green-500" />
                  <span>{configSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-red-600/15 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                บันทึกการตั้งค่าทั้งหมด
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-800">
              <h4 className="font-bold text-xs text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                🚨 ส่วนควบคุมฤดูกาล (Season Reset Control)
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                การกดรีเซ็ตจะเป็นการเริ่มซีซั่นใหม่ โดยระดับแร้งกิ้งของผู้เล่นทุกคนจะถูกคำนวณและปรับลดลงตามฤดูกาล (Soft-Reset) รวมถึงล้างดาวและรีเซ็ตเควสเลื่อนระดับทั้งหมดเพื่อรับซีซั่นใหม่
              </p>
              <button
                type="button"
                disabled={resetLoading}
                onClick={handleResetMonthlyRanks}
                className="w-full py-3 bg-red-950/40 border border-red-900/40 hover:bg-red-900/40 text-red-200 text-xs font-bold rounded-xl transition-all cursor-pointer select-none"
              >
                {resetLoading ? 'กำลังประมวลผลการรีเซ็ตแร้งกิ้ง...' : '🔄 รีเซ็ตแร้งกิ้งต้อนรับฤดูกาลใหม่ (Reset Ranks for New Season)'}
              </button>
              {resetSuccess && (
                <p className="text-xs text-green-400 mt-2 font-semibold text-center">{resetSuccess}</p>
              )}
            </div>
          </div>
        ) : activeTab === 'subjects_grades' ? (
          /* Manage Subjects & Grades Tab */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start text-left">
            {/* Left Column: Manage Subjects */}
            <div className="glass-panel p-5 rounded-2xl border-slate-700/50 flex flex-col gap-5">
              <h3 className="font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800 text-sm sm:text-base">
                📚 จัดการรายชื่อวิชาและขอบเขตชั้นเรียน
              </h3>

              {subError && (
                <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-400 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{subError}</span>
                </div>
              )}

              {subSuccess && (
                <div className="p-3 bg-green-950/20 border border-green-900/30 text-green-400 text-xs rounded-xl flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-green-500 shrink-0" />
                  <span>{subSuccess}</span>
                </div>
              )}

              {/* Add Subject Form */}
              <form onSubmit={handleAddSubject} className="space-y-4 bg-slate-950/20 p-4 rounded-xl border border-slate-850">
                <h4 className="font-bold text-xs text-white uppercase tracking-wider mb-2">➕ เพิ่ม / อัปเดตข้อมูลวิชาเรียน</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">รหัสวิชาภาษาอังกฤษ (ID)*</label>
                    <input
                      type="text"
                      placeholder="เช่น Science, History"
                      value={subFormId}
                      onChange={(e) => setSubFormId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">ชื่อภาษาไทย (TH Name)*</label>
                    <input
                      type="text"
                      placeholder="เช่น วิทยาศาสตร์"
                      value={subFormName}
                      onChange={(e) => setSubFormName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">ชื่อภาษาอังกฤษ (EN Name)*</label>
                    <input
                      type="text"
                      placeholder="เช่น Science"
                      value={subFormNameEn}
                      onChange={(e) => setSubFormNameEn(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">ไอคอน Emoji*</label>
                    <input
                      type="text"
                      placeholder="🔬"
                      value={subFormIcon}
                      onChange={(e) => setSubFormIcon(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white text-center outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">เฉดสีธีม (Tailwind CSS gradient)</label>
                    <select
                      value={subFormColor}
                      onChange={(e) => setSubFormColor(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none"
                    >
                      <option value="from-blue-500 to-cyan-500">น้ำเงิน - ฟ้า (Mathematics)</option>
                      <option value="from-orange-500 to-amber-500">ส้ม - เหลือง (Thai)</option>
                      <option value="from-pink-500 to-rose-500">ชมพู - แดง (English)</option>
                      <option value="from-green-500 to-emerald-500">เขียว - มรกต (Science)</option>
                      <option value="from-purple-500 to-violet-500">ม่วง - ม่วงคราม (Social)</option>
                      <option value="from-teal-500 to-cyan-600">เทอร์ควอยซ์ - ฟ้าเข้ม</option>
                      <option value="from-red-500 to-orange-500">แดง - ส้ม</option>
                      <option value="from-yellow-400 to-orange-500">เหลือง - ส้ม</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">สิทธิ์ระดับชั้นที่อนุญาตให้เล่น (Allowed Grades)*</label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 bg-slate-950 p-3 rounded-lg border border-slate-850">
                    {grades.map(g => {
                      const isChecked = subFormAllowedGrades.includes(g.id)
                      return (
                        <label key={g.id} className="flex items-center gap-1.5 text-xs text-slate-350 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSubFormAllowedGrades(prev => [...prev, g.id])
                              } else {
                                setSubFormAllowedGrades(prev => prev.filter(id => id !== g.id))
                              }
                            }}
                            className="rounded border-slate-800 bg-slate-950 text-red-500 focus:ring-red-500 w-3.5 h-3.5"
                          />
                          <span>{g.label}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">หมวดหมู่ของวิชา (Categories JSON)*</label>
                  <textarea
                    value={subFormCategories}
                    onChange={(e) => setSubFormCategories(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white font-mono outline-none"
                    placeholder='[{"id": "mixed", "label": "ผสมทุกหมวด", "labelEn": "Mixed"}]'
                    required
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={subFormIsActive}
                    onChange={(e) => setSubFormIsActive(e.target.checked)}
                    className="rounded border-slate-800 bg-slate-950 text-red-500 focus:ring-red-500 w-3.5 h-3.5"
                  />
                  <label htmlFor="isActive" className="text-xs text-slate-300 font-bold cursor-pointer select-none">เปิดใช้งานทันที (Active Status)</label>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  บันทึก / อัปเดตวิชาเรียน
                </button>
              </form>

              {/* Subjects List */}
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider text-left">รายการวิชาปัจจุบัน ({subjects.length} วิชา)</h4>
                {subjects.map(sub => (
                  <div key={sub.id} className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{sub.icon}</span>
                        <span className="font-bold text-xs sm:text-sm text-white">{sub.name} ({sub.nameEn})</span>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${
                          sub.active ? 'bg-green-950 text-green-400 border border-green-900/55' : 'bg-slate-950 text-slate-500 border border-slate-900'
                        }`}>
                          {sub.active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal mb-1 font-mono select-all">ID: {sub.id}</p>
                      <p className="text-[10px] text-slate-450 leading-normal truncate">
                        <strong>ระดับชั้นที่อนุญาต:</strong> {sub.allowed_grades && sub.allowed_grades.length > 0 ? sub.allowed_grades.join(', ') : 'ไม่มีสิทธิ์กำหนด'}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSubFormId(sub.id)
                          setSubFormName(sub.name)
                          setSubFormNameEn(sub.nameEn)
                          setSubFormIcon(sub.icon)
                          setSubFormColor(sub.color)
                          setSubFormCategories(JSON.stringify(sub.categories))
                          setSubFormAllowedGrades(sub.allowed_grades || [])
                          setSubFormIsActive(sub.active)
                        }}
                        className="p-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer text-[10px] font-bold"
                        title="แก้ไขวิชา"
                      >
                        แก้ไข
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSubject(sub.id)}
                        className="p-1.5 rounded-lg bg-red-950/40 border border-red-900/30 flex items-center justify-center text-red-400 hover:bg-red-900/50 hover:text-white transition-all cursor-pointer"
                        title="ลบวิชา"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Manage Grade Levels */}
            <div className="glass-panel p-5 rounded-2xl border-slate-700/50 flex flex-col gap-5">
              <h3 className="font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800 text-sm sm:text-base">
                🎓 จัดการระดับชั้นเรียนหลัก
              </h3>

              {/* Add Grade Form */}
              <form onSubmit={handleAddGrade} className="space-y-4 bg-slate-950/20 p-4 rounded-xl border border-slate-850">
                <h4 className="font-bold text-xs text-white uppercase tracking-wider mb-2">➕ เพิ่ม / อัปเดตข้อมูลระดับชั้นเรียน</h4>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">รหัสย่อ (ID)*</label>
                    <input
                      type="text"
                      placeholder="เช่น P7, M4"
                      value={gradeFormId}
                      onChange={(e) => setGradeFormId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">ตัวย่อ (Label)*</label>
                    <input
                      type="text"
                      placeholder="เช่น ป.7, ม.4"
                      value={gradeFormLabel}
                      onChange={(e) => setGradeFormLabel(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">ชื่อเต็ม (Name)*</label>
                    <input
                      type="text"
                      placeholder="เช่น มัธยมศึกษาปีที่ 4"
                      value={gradeFormName}
                      onChange={(e) => setGradeFormName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  บันทึกระดับชั้นเรียน
                </button>
              </form>

              {/* Grades List */}
              <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider text-left">รายการระดับชั้นปัจจุบัน ({grades.length} ชั้นเรียน)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {grades.map(g => (
                    <div key={g.id} className="p-2.5 bg-slate-950/40 border border-slate-850 rounded-xl flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-xs text-white bg-slate-800 px-1.5 py-0.5 rounded">{g.label}</span>
                          <span className="text-[10px] text-slate-400 truncate">{g.name}</span>
                        </div>
                        <span className="text-[8px] font-mono text-slate-600">ID: {g.id}</span>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setGradeFormId(g.id)
                            setGradeFormLabel(g.label)
                            setGradeFormName(g.name)
                          }}
                          className="p-1 rounded bg-slate-850 hover:bg-slate-800 text-slate-350 hover:text-white transition-colors cursor-pointer text-[9px]"
                          title="แก้ไขชั้นเรียน"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteGrade(g.id)}
                          className="p-1 rounded bg-red-950/40 border border-red-900/30 text-red-400 hover:bg-red-900/50 hover:text-white transition-all cursor-pointer text-[9px]"
                          title="ลบระดับชั้น"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full text-left">
            <DashboardScreen isEmbedded={true} />
          </div>
        )}
      </div>
    </div>
  )
}
