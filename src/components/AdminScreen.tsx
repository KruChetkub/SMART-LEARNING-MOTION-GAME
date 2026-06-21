import React, { useState, useEffect } from 'react'
import { Plus, Trash2, ArrowLeft, Settings, Save, ShieldAlert, Sparkles, BookOpen, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { SubjectId, Question } from '../types/game'
import { DashboardScreen } from './DashboardScreen'
import * as XLSX from 'xlsx'

interface AdminScreenProps {
  onGoHome: () => void
  onRefreshSettings: () => void
}

const GRADE_LEVELS = [
  { id: 'P1', label: 'ประถมศึกษาปีที่ 1 (ป.1)' },
  { id: 'P2', label: 'ประถมศึกษาปีที่ 2 (ป.2)' },
  { id: 'P3', label: 'ประถมศึกษาปีที่ 3 (ป.3)' },
  { id: 'P4', label: 'ประถมศึกษาปีที่ 4 (ป.4)' },
  { id: 'P5', label: 'ประถมศึกษาปีที่ 5 (ป.5)' },
  { id: 'P6', label: 'ประถมศึกษาปีที่ 6 (ป.6)' },
  { id: 'M1', label: 'มัธยมศึกษาปีที่ 1 (ม.1)' },
  { id: 'M2', label: 'มัธยมศึกษาปีที่ 2 (ม.2)' },
  { id: 'M3', label: 'มัธยมศึกษาปีที่ 3 (ม.3)' },
  { id: 'M4', label: 'มัธยมศึกษาปีที่ 4 (ม.4)' },
  { id: 'M5', label: 'มัธยมศึกษาปีที่ 5 (ม.5)' },
  { id: 'M6', label: 'มัธยมศึกษาปีที่ 6 (ม.6)' }
]

export const AdminScreen: React.FC<AdminScreenProps> = ({ onGoHome, onRefreshSettings }) => {
  const [activeTab, setActiveTab] = useState<'questions' | 'settings' | 'analytics'>('questions')
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

  // Game configuration states
  const [mathTimeLimit, setMathTimeLimit] = useState<number>(15)
  const [mathQuestions, setMathQuestions] = useState<number>(5)
  const [thaiTimeLimit, setThaiTimeLimit] = useState<number>(15)
  const [thaiQuestions, setThaiQuestions] = useState<number>(5)
  const [englishTimeLimit, setEnglishTimeLimit] = useState<number>(15)
  const [englishQuestions, setEnglishQuestions] = useState<number>(5)
  const [configSuccess, setConfigSuccess] = useState<string | null>(null)
  
  // Season Reset States
  const [resetLoading, setResetLoading] = useState<boolean>(false)
  const [resetSuccess, setResetSuccess] = useState<string | null>(null)

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
      
      // Default fallbacks
      setMathTimeLimit(15)
      setMathQuestions(5)
      setThaiTimeLimit(15)
      setThaiQuestions(5)
      setEnglishTimeLimit(15)
      setEnglishQuestions(5)
      
      if (!error && data) {
        data.forEach(item => {
          if (item.subject === 'Mathematics') {
            setMathTimeLimit(item.time_limit)
            setMathQuestions(item.questions_per_game)
          } else if (item.subject === 'Thai') {
            setThaiTimeLimit(item.time_limit)
            setThaiQuestions(item.questions_per_game)
          } else if (item.subject === 'English') {
            setEnglishTimeLimit(item.time_limit)
            setEnglishQuestions(item.questions_per_game)
          }
        })
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchQuestions()
  }, [selectedSubject, selectedGradeLevel])

  useEffect(() => {
    fetchSettings(settingsGradeLevel)
  }, [settingsGradeLevel])

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
      const updates = [
        { subject: 'Mathematics', grade_level: settingsGradeLevel, time_limit: mathTimeLimit, questions_per_game: mathQuestions },
        { subject: 'Thai', grade_level: settingsGradeLevel, time_limit: thaiTimeLimit, questions_per_game: thaiQuestions },
        { subject: 'English', grade_level: settingsGradeLevel, time_limit: englishTimeLimit, questions_per_game: englishQuestions }
      ]

      for (const update of updates) {
        const { error } = await supabase
          .from('game_settings')
          .upsert(update, { onConflict: 'subject,grade_level' })
        if (error) throw error
      }

      setConfigSuccess(`อัปเดตการตั้งค่าระดับชั้น ${settingsGradeLevel} เรียบร้อยแล้ว!`)
      onRefreshSettings()
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า')
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
      <div className="flex gap-2 p-1 rounded-xl bg-white/5 border border-white/10 mb-6 w-fit select-none">
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
                    onChange={(e) => setSelectedSubject(e.target.value as SubjectId)}
                    className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1 text-xs outline-none cursor-pointer"
                  >
                    <option value="Mathematics">Mathematics (คณิตศาสตร์)</option>
                    <option value="Thai">Thai (ภาษาไทย)</option>
                    <option value="English">English (ภาษาอังกฤษ)</option>
                  </select>
                  <select
                    value={selectedGradeLevel}
                    onChange={(e) => setSelectedGradeLevel(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1 text-xs outline-none cursor-pointer"
                  >
                    {GRADE_LEVELS.map(g => (
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
                        onChange={(e) => setNewSubject(e.target.value as SubjectId)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none"
                      >
                        <option value="Mathematics">คณิตศาสตร์</option>
                        <option value="Thai">ภาษาไทย</option>
                        <option value="English">ภาษาอังกฤษ</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">ระดับชั้น (Grade)</label>
                      <select
                        value={newGradeLevel}
                        onChange={(e) => setNewGradeLevel(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none"
                      >
                        {GRADE_LEVELS.map(g => (
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
                {GRADE_LEVELS.map(g => (
                  <option key={g.id} value={g.id}>{g.label}</option>
                ))}
              </select>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Mathematics Row */}
              <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl">
                <h4 className="font-bold text-xs text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  📐 Mathematics (วิชาคณิตศาสตร์)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1">เวลานับถอยหลังต่อข้อ (วินาที)</label>
                    <select
                      value={mathTimeLimit}
                      onChange={(e) => setMathTimeLimit(parseInt(e.target.value, 10))}
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
                      value={mathQuestions}
                      onChange={(e) => setMathQuestions(parseInt(e.target.value, 10))}
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

              {/* Thai Row */}
              <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl">
                <h4 className="font-bold text-xs text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  🇹🇭 Thai (วิชาภาษาไทย)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1">เวลานับถอยหลังต่อข้อ (วินาที)</label>
                    <select
                      value={thaiTimeLimit}
                      onChange={(e) => setThaiTimeLimit(parseInt(e.target.value, 10))}
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
                      value={thaiQuestions}
                      onChange={(e) => setThaiQuestions(parseInt(e.target.value, 10))}
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

              {/* English Row */}
              <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl">
                <h4 className="font-bold text-xs text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  🇬🇧 English (วิชาภาษาอังกฤษ)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1">เวลานับถอยหลังต่อข้อ (วินาที)</label>
                    <select
                      value={englishTimeLimit}
                      onChange={(e) => setEnglishTimeLimit(parseInt(e.target.value, 10))}
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
                      value={englishQuestions}
                      onChange={(e) => setEnglishQuestions(parseInt(e.target.value, 10))}
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
        ) : (
          <div className="w-full text-left">
            <DashboardScreen isEmbedded={true} />
          </div>
        )}
      </div>
    </div>
  )
}
