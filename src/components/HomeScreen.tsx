import React, { useState, useEffect, useRef } from 'react'
import { HelpCircle, Settings, X, LogIn } from 'lucide-react'
import type { SubjectId, SubjectConfig, GradeLevel } from '../types/game'
import { getSubjectCategories } from '../data/questions'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

interface HomeScreenProps {
  subjects: SubjectConfig[]
  grades: GradeLevel[]
  onStartGame: (
    subject: SubjectId,
    category: string,
    gradeLevel: string
  ) => void
  soundEnabled: boolean
  onToggleSound: () => void
  cameraRotation: number
  setCameraRotation: (angle: number) => void
  mirrorHorizontal: boolean
  setMirrorHorizontal: (val: boolean) => void
  virtualCameraOutput: boolean
  setVirtualCameraOutput: (val: boolean) => void
  user: any | null
  profile: any | null
  onLogin: () => void
  onLogout: () => void
  onOpenAdmin?: () => void
  onOpenLeaderboard?: () => void
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  subjects,
  grades,
  onStartGame,
  soundEnabled,
  onToggleSound,
  cameraRotation,
  setCameraRotation,
  mirrorHorizontal,
  setMirrorHorizontal,
  virtualCameraOutput,
  setVirtualCameraOutput,
  user,
  profile,
  onLogin,
  onLogout,
  onOpenAdmin,
  onOpenLeaderboard
}) => {
  const [showHowTo, setShowHowTo] = useState(false)
  const [showCameraSettings, setShowCameraSettings] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<SubjectId>('Mathematics')
  const [selectedGrade, setSelectedGrade] = useState<string>('P1')
  const [selectedCategory, setSelectedCategory] = useState('mixed')
  const [availableCategories, setAvailableCategories] = useState<{ id: string; label: string; labelEn: string }[]>([])

  // Ensure selectedSubject is valid based on the dynamic subjects prop
  useEffect(() => {
    if (subjects.length > 0) {
      const isStillValid = subjects.some(s => s.id === selectedSubject && s.active)
      if (!isStillValid) {
        const firstActive = subjects.find(s => s.active)
        if (firstActive) {
          setSelectedSubject(firstActive.id)
        }
      }
    }
  }, [subjects, selectedSubject])

  // Ensure selectedGrade is within the allowed grades of the selected subject
  useEffect(() => {
    const activeSub = subjects.find(s => s.id === selectedSubject)
    if (activeSub) {
      const allowed = activeSub.allowed_grades || []
      // If selected grade is not allowed, select the first allowed grade
      if (allowed.length > 0 && !allowed.includes(selectedGrade)) {
        if (!user && allowed.includes('P1')) {
          setSelectedGrade('P1')
        } else {
          setSelectedGrade(allowed[0])
        }
      }
    }
  }, [selectedSubject, subjects, user])

  // Guest users are locked to grade P1
  useEffect(() => {
    if (!user) {
      setSelectedGrade('P1')
    }
  }, [user])

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [webcamStatus, setWebcamStatus] = useState<'inactive' | 'loading' | 'active' | 'error'>('inactive')

  useEffect(() => {
    let active = true

    async function loadCategories() {
      // Force guests to P1
      const activeGrade = user ? selectedGrade : 'P1'
      
      // Start with offline categories
      const offlineCats = getSubjectCategories(selectedSubject, activeGrade)
      let finalCats = [...offlineCats]

      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('questions')
            .select('category')
            .eq('subject', selectedSubject)
            .eq('grade_level', activeGrade)
          
          if (!error && data && data.length > 0) {
            const onlineCatIds = Array.from(new Set(data.map(q => q.category)))
            
            const config = subjects.find(s => s.id === selectedSubject)
            const categoryMap = new Map(config?.categories.map(c => [c.id, c]) || [])

            const onlineCats = onlineCatIds.map(catId => {
              return categoryMap.get(catId) || { id: catId, label: catId, labelEn: catId }
            })

            const merged = [...finalCats]
            onlineCats.forEach(oc => {
              if (!merged.some(mc => mc.id === oc.id)) {
                merged.push(oc)
              }
            })
            finalCats = merged
          }
        } catch (e) {
          console.error('Error fetching categories from database:', e)
        }
      }

      // Restrict categories for guest users to only allowed ones
      if (!user) {
        if (selectedSubject === 'Mathematics') {
          finalCats = finalCats.filter(c => c.id === 'mixed' || c.id === 'addition' || c.id === 'subtraction')
        } else if (selectedSubject === 'Thai') {
          finalCats = finalCats.filter(c => c.id === 'mixed' || c.id === 'vowels' || c.id === 'consonants' || c.id === 'reading' || c.id === 'vocabulary')
        } else if (selectedSubject === 'English') {
          finalCats = finalCats.filter(c => c.id === 'mixed' || c.id === 'vocabulary' || c.id === 'grammar' || c.id === 'spelling' || c.id === 'reading')
        }
      }

      if (active) {
        setAvailableCategories(finalCats)
        if (!finalCats.some(c => c.id === selectedCategory)) {
          const hasMixed = finalCats.some(c => c.id === 'mixed')
          setSelectedCategory(hasMixed ? 'mixed' : (finalCats[0]?.id || 'mixed'))
        }
      }
    }

    loadCategories()
    return () => {
      active = false
    }
  }, [selectedSubject, selectedGrade, user])

  useEffect(() => {
    let active = true

    async function startCamera() {
      if (!showCameraSettings) {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }
        setWebcamStatus('inactive')
        return
      }

      try {
        setWebcamStatus('loading')
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 360 },
            facingMode: 'user'
          },
          audio: false
        })

        if (!active) {
          stream.getTracks().forEach(t => t.stop())
          return
        }

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(err => {
            console.error('Settings video play error:', err)
          })
        }
        setWebcamStatus('active')
      } catch (err) {
        console.error('Settings video error:', err)
        if (active) {
          setWebcamStatus('error')
        }
      }
    }

    startCamera()

    return () => {
      active = false
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [showCameraSettings])

  // Get current subject config
  const currentSubject = subjects.find(s => s.id === selectedSubject)

  // Reset category when switching subjects
  const handleSubjectChange = (subjectId: SubjectId) => {
    setSelectedSubject(subjectId)
    setSelectedCategory('mixed')
  }

  const getSubjectGlowStyle = (subjectId: string) => {
    switch (subjectId) {
      case 'Mathematics':
        return 'ring-2 ring-cyan-400/40 shadow-[0_0_12px_rgba(34,211,238,0.25)]'
      case 'Thai':
        return 'ring-2 ring-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
      case 'English':
        return 'ring-2 ring-rose-400/40 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
      case 'Science':
        return 'ring-2 ring-emerald-400/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
      case 'Social':
        return 'ring-2 ring-violet-400/40 shadow-[0_0_12px_rgba(139,92,246,0.25)]'
      default:
        return 'ring-2 ring-primary/40 shadow-[0_0_12px_rgba(37,99,235,0.25)]'
    }
  }

  // Category color palette per subject (dynamic fallback support)
  const getCategoryColors = (subjectId: SubjectId) => {
    const glows = getSubjectGlowStyle(subjectId)
    const colors: Record<string, { active: string; default: string }> = {
      Mathematics: { active: `bg-secondary text-white font-black ${glows} scale-[1.01]`, default: 'bg-slate-950/60 border border-slate-800 hover:bg-slate-900 text-slate-400 touch-target' },
      Thai: { active: `bg-orange-500 text-white font-black ${glows} scale-[1.01]`, default: 'bg-slate-950/60 border border-slate-800 hover:bg-slate-900 text-slate-400 touch-target' },
      English: { active: `bg-pink-500 text-white font-black ${glows} scale-[1.01]`, default: 'bg-slate-950/60 border border-slate-800 hover:bg-slate-900 text-slate-400 touch-target' },
      Science: { active: `bg-emerald-500 text-white font-black ${glows} scale-[1.01]`, default: 'bg-slate-950/60 border border-slate-800 hover:bg-slate-900 text-slate-400 touch-target' },
      Social: { active: `bg-violet-500 text-white font-black ${glows} scale-[1.01]`, default: 'bg-slate-950/60 border border-slate-800 hover:bg-slate-900 text-slate-400 touch-target' },
    }
    return colors[subjectId] || { active: `bg-primary text-white font-black ${glows} scale-[1.01]`, default: 'bg-slate-950/60 border border-slate-800 hover:bg-slate-900 text-slate-400 touch-target' }
  }

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col justify-between min-h-[90svh] px-0 py-0">
      
      {/* ========================================================================= */}
      {/* 🖥️ DESKTOP VIEW (Large screens, 1024px and up) */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex flex-col gap-6 w-full px-0 py-0">
        
        {/* Desktop Header */}
        <div className="w-full flex justify-between items-start mb-6">
          {/* Top Left: Logo Panel */}
          <div className="cyber-logo-panel px-6 py-3 flex items-center">
            <img src="/Smart Math Motion Logo46.svg" alt="Smart Learning Logo" className="h-9 w-auto object-contain" />
          </div>

          {/* Top Right: Language Toggle & Leaderboard/Admin buttons (NO User role text) */}
          <div className="flex items-center gap-3 pt-4 pr-4">
            {profile && (profile.role === 'admin' || profile.role === 'superadmin') && onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="text-xs bg-red-950/40 border border-red-900/30 text-red-400 px-4 py-2 rounded-full font-bold hover:bg-red-900/40 transition-colors flex items-center gap-1.5 cursor-pointer select-none"
              >
                🛠️ Admin Panel
              </button>
            )}
            {onOpenLeaderboard && (
              <button
                onClick={onOpenLeaderboard}
                className="text-xs bg-cyan-950/40 border border-cyan-900/30 text-cyan-400 px-4 py-2 rounded-full font-bold hover:bg-cyan-900/40 transition-colors flex items-center gap-1.5 cursor-pointer select-none"
              >
                🏆 Leaderboard
              </button>
            )}
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs tracking-wider transition-all shadow-[0_0_10px_rgba(6,182,212,0.35)] cursor-pointer select-none">
              <span>🌐</span>
              <span>ไทย / English</span>
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="w-full text-center flex flex-col items-center my-2 px-4">
          <h2 className="font-display italic font-black text-2xl text-cyan-400/90 tracking-widest cyber-title-glow">
            Smart Learning
          </h2>
          <div className="relative my-2">
            <div className="absolute -inset-x-10 top-1/2 h-8 bg-cyan-500/10 blur-xl -translate-y-1/2 -z-10 rounded-full" />
            <h1 className="font-display italic font-black text-5xl text-white tracking-widest leading-none drop-shadow-[0_0_15px_rgba(6,182,212,0.45)]">
              Motion Game
            </h1>
          </div>
          <span className="text-sm font-display italic font-bold tracking-widest text-cyan-400/80 uppercase cyber-subtitle-line pb-1">
            Active Learning Arcade
          </span>
        </div>

        {/* Subjects Grid (Full width row, 4 columns) */}
        <div className="w-full mt-2 px-4">
          <label className="block text-xs font-bold text-slate-400 tracking-wider uppercase mb-3 text-left">
            เลือกวิชาเรียน (Select Subject)
          </label>
          <div className="grid grid-cols-4 gap-4">
            {subjects.map((sub) => {
              const isActive = sub.active
              const isSelected = selectedSubject === sub.id
              const glows = getSubjectGlowStyle(sub.id)
              return (
                <button
                  key={sub.id}
                  disabled={!isActive}
                  onClick={() => handleSubjectChange(sub.id)}
                  className={`w-full p-4.5 rounded-2xl font-display font-bold text-sm tracking-wide text-left flex items-center justify-between transition-all min-w-0 ${
                    isActive
                      ? isSelected
                        ? 'bg-gradient-to-r ' + sub.color + ' text-white scale-[1.02] border-transparent ' + glows
                        : 'bg-slate-950/60 border border-slate-800 hover:bg-slate-900 text-slate-350 hover:translate-y-[-1px] hover:border-slate-700/50'
                      : 'bg-slate-950/20 border border-slate-900/30 text-slate-650 cursor-not-allowed opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl shrink-0">{sub.icon}</span>
                    <span className="truncate text-sm font-black">{sub.name} ({sub.nameEn})</span>
                  </div>
                  {isActive ? (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/20 text-white uppercase font-black shrink-0">
                      Ready
                    </span>
                  ) : (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-950/60 text-slate-600 uppercase font-black shrink-0">
                      Soon
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Bottom Split Row (Left: CTA/Profile, Right: Grades) */}
        <div className="w-full grid grid-cols-[1fr_1.5fr] gap-8 items-start mt-4 px-4 pb-6">
          
          {/* Left Column: CTA & Profiles */}
          <div className="flex flex-col gap-5">
            {/* Profile Card */}
            <div className="glass-panel p-5 rounded-2xl border-slate-800/80 flex flex-col gap-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500/30 to-blue-500/30" />
              {user ? (
                <>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3 w-full min-w-0">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Profile" className="w-11 h-11 rounded-full border border-secondary shrink-0 shadow-md shadow-secondary/10" />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-secondary/20 border border-secondary flex items-center justify-center font-bold text-white text-lg shrink-0 shadow-md shadow-secondary/10">
                          {profile?.display_name?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0 text-left">
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block leading-none mb-1">ผู้เล่น</span>
                        <span className="font-bold text-sm text-white truncate block leading-tight">{profile?.display_name || user.email}</span>
                      </div>
                    </div>
                    <button
                      onClick={onLogout}
                      className="text-xs bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:text-white text-slate-400 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer"
                    >
                      ออก
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-2 w-full text-left">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">สมาชิกระบบ</span>
                  <p className="text-[11px] text-slate-450 leading-normal mb-1.5">ล็อกอินเพื่อบันทึกสถิติ คะแนนสูงสุด และตั้งค่ากล้องของคุณ!</p>
                  <button
                    onClick={onLogin}
                    className="w-full py-3 bg-gradient-to-r from-primary to-secondary hover:from-primary/95 hover:to-secondary/95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md border-transparent"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>เข้าสู่ระบบ / สมัครสมาชิก</span>
                  </button>
                </div>
              )}
            </div>

            {/* Play Button CTA */}
            <div className="flex flex-col gap-1 w-full">
              <button
                onClick={() => onStartGame(selectedSubject, selectedCategory, selectedGrade)}
                className="w-full py-4.5 rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-500 hover:via-blue-500 hover:to-purple-500 text-white font-display font-extrabold text-xl sm:text-2xl shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:shadow-[0_0_30px_rgba(6,182,212,0.55)] ring-2 ring-cyan-400/60 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                เข้าสู่เกม (Play Game)
              </button>
            </div>

            {/* Camera settings */}
            <button
              onClick={() => setShowCameraSettings(true)}
              className="w-full py-3.5 bg-slate-950/70 border border-slate-800/80 hover:bg-slate-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shadow-md"
            >
              ⚙️ ตั้งค่ากล้อง (Camera Settings)
            </button>

            {/* Sound & How to play */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowHowTo(true)}
                className="py-3 px-4 rounded-xl glass-panel-interactive text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                ❔ วิธีเล่น (How to Play)
              </button>
              <button
                onClick={onToggleSound}
                className="py-3 px-4 rounded-xl glass-panel-interactive text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {soundEnabled ? '🔊 เปิดเสียง (Sound On)' : '🔇 ปิดเสียง (Muted)'}
              </button>
            </div>
          </div>

          {/* Right Column: Grades and Categories */}
          <div className="flex flex-col gap-6">
            {/* Grade Selector */}
            {currentSubject && currentSubject.active && (
              <div className="w-full bg-slate-950/50 border border-slate-850 rounded-2xl p-5 text-left relative overflow-hidden shadow-lg">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500/50 via-blue-500/50 to-purple-500/50" />
                <label className="block text-xs font-black text-slate-400 tracking-wider uppercase mb-4">
                  เลือกระดับชั้นเรียน (Grade Level)
                </label>
                
                <div className="space-y-4">
                  {/* Primary */}
                  {grades.some(g => g.id.startsWith('P') && (currentSubject.allowed_grades || []).includes(g.id)) && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">ประถมศึกษา (Primary)</span>
                      <div className="grid grid-cols-6 gap-2 text-xs">
                        {grades.filter(g => g.id.startsWith('P') && (currentSubject.allowed_grades || []).includes(g.id)).map((g) => {
                          if (!user && g.id !== 'P1') return null
                          const colors = getCategoryColors(selectedSubject)
                          return (
                            <button
                              key={g.id}
                              onClick={() => setSelectedGrade(g.id)}
                              className={`py-2.5 px-1 rounded-xl font-bold transition-all cursor-pointer text-center ${
                                selectedGrade === g.id ? colors.active : colors.default
                              }`}
                            >
                              {g.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Secondary */}
                  {user && grades.some(g => g.id.startsWith('M') && (currentSubject.allowed_grades || []).includes(g.id)) && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">มัธยมศึกษา (Secondary)</span>
                      <div className="grid grid-cols-6 gap-2 text-xs">
                        {grades.filter(g => g.id.startsWith('M') && (currentSubject.allowed_grades || []).includes(g.id)).map((g) => {
                          const colors = getCategoryColors(selectedSubject)
                          return (
                            <button
                              key={g.id}
                              onClick={() => setSelectedGrade(g.id)}
                              className={`py-2.5 px-1 rounded-xl font-bold transition-all cursor-pointer text-center ${
                                selectedGrade === g.id ? colors.active : colors.default
                              }`}
                            >
                              {g.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Category Selector */}
            {currentSubject && currentSubject.active && availableCategories.length > 1 && (
              <div className="w-full bg-slate-950/50 border border-slate-850 rounded-2xl p-5 text-left relative overflow-hidden shadow-lg">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500/50 via-blue-500/50 to-purple-500/50" />
                <label className="block text-xs font-black text-slate-400 tracking-wider uppercase mb-4">
                  {currentSubject.id === 'Mathematics' ? 'โหมดฝึกซ้อม (Practice Mode)' : 'หมวดหมู่ (Category)'}
                </label>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {availableCategories.map((cat, index) => {
                    const isLast = index === availableCategories.length - 1
                    const isOdd = availableCategories.length % 2 !== 0
                    const colors = getCategoryColors(selectedSubject)
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`py-3 px-3 rounded-xl font-bold transition-all cursor-pointer text-center ${
                          isLast && isOdd ? 'col-span-2' : ''
                        } ${selectedCategory === cat.id ? colors.active : colors.default}`}
                      >
                        {cat.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📱 MOBILE VIEW (Tablet / Mobile screen, hidden on lg breakpoint) */}
      {/* ========================================================================= */}
      <div className="flex lg:hidden flex-col gap-5 w-full">
        
        {/* Mobile Header (NO User role text displayed in top-right) */}
        <div className="w-full flex justify-between items-start mb-6">
          {/* Top Left: Logo Panel */}
          <div className="cyber-logo-panel px-6 py-3 flex items-center">
            <img src="/Smart Math Motion Logo46.svg" alt="Smart Learning Logo" className="h-9 w-auto object-contain" />
          </div>

          {/* Top Right: Language Toggle Only */}
          <div className="pt-4 pr-4">
            <button className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-[9px] tracking-wider transition-all shadow-[0_0_10px_rgba(6,182,212,0.35)] select-none cursor-pointer">
              <span>🌐</span>
              <span>ไทย / English</span>
            </button>
          </div>
        </div>

        {/* Game Title Display */}
        <div className="w-full text-center flex flex-col items-center select-none px-4">
          <h2 className="font-display italic font-black text-xl sm:text-2xl text-cyan-400/90 tracking-widest cyber-title-glow">
            Smart Learning
          </h2>
          <div className="relative my-1">
            <div className="absolute -inset-x-8 top-1/2 h-6 bg-cyan-500/10 blur-xl -translate-y-1/2 -z-10 rounded-full" />
            <h1 className="font-display italic font-black text-3xl sm:text-4xl text-white tracking-widest leading-none drop-shadow-[0_0_12px_rgba(6,182,212,0.4)]">
              Motion Game
            </h1>
          </div>
          <span className="text-[10px] sm:text-xs font-display italic font-bold tracking-widest text-cyan-400/80 uppercase cyber-subtitle-line pb-0.5">
            Active Learning Arcade
          </span>
        </div>

        {/* User Profile / Status HUD (Only if logged in) */}
        {user && (
          <div className="w-full max-w-md mx-auto bg-slate-950/70 border border-slate-900/60 rounded-2xl p-3.5 flex flex-col gap-3 text-left shadow-md mx-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-8 h-8 rounded-full border border-cyan-450 shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-cyan-950/40 border border-cyan-450 flex items-center justify-center font-bold text-white text-xs shrink-0">
                    {profile?.display_name?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="font-bold text-xs text-white truncate block">{profile?.display_name || user.email}</span>
                    <span className="text-[7px] bg-cyan-950 border border-cyan-900/50 text-cyan-400 font-extrabold px-1 rounded py-0.5">Lvl {profile?.level || 1}</span>
                  </div>
                  <span className="text-[9px] text-amber-450 font-semibold block mt-1">Rank: {profile?.rank_tier || 'Bronze III'}</span>
                </div>
              </div>
              
              <button
                onClick={onLogout}
                className="text-[8px] font-black uppercase text-slate-400 hover:text-white px-2 py-1 bg-slate-900 border border-slate-800 rounded transition-all cursor-pointer"
              >
                Sign Out
              </button>
            </div>

            {/* Quick Actions inside Profile HUD: Admin Panel & Leaderboard */}
            <div className="flex gap-2 w-full border-t border-slate-900/60 pt-2.5">
              {profile && (profile.role === 'admin' || profile.role === 'superadmin') && onOpenAdmin && (
                <button
                  onClick={onOpenAdmin}
                  className="flex-1 py-1.5 bg-red-950/40 border border-red-900/30 hover:bg-red-900/30 text-red-400 text-[10px] font-black uppercase rounded-lg transition-all text-center cursor-pointer select-none"
                >
                  ⚙️ Admin Panel
                </button>
              )}
              {onOpenLeaderboard && (
                <button
                  onClick={onOpenLeaderboard}
                  className="flex-1 py-1.5 bg-cyan-950/40 border border-cyan-900/30 hover:bg-cyan-900/30 text-cyan-400 text-[10px] font-black uppercase rounded-lg transition-all text-center cursor-pointer select-none"
                >
                  🏆 Leaderboard
                </button>
              )}
            </div>
          </div>
        )}

        {/* Guest Login Hint (Only if guest) */}
        {!user && (
          <div className="w-full max-w-md mx-auto flex gap-2 px-4">
            <button
              onClick={onLogin}
              className="flex-[2] py-2 bg-slate-950/60 border border-slate-850 hover:border-cyan-400/50 hover:bg-slate-900 text-slate-350 font-bold text-[10px] rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <LogIn className="w-3 h-3 text-cyan-400" />
              <span>เข้าสู่ระบบเพื่อบันทึกประวัติ</span>
            </button>
            {onOpenLeaderboard && (
              <button
                onClick={onOpenLeaderboard}
                className="flex-1 py-2 bg-cyan-950/40 border border-cyan-900/30 hover:bg-cyan-950/30 text-cyan-400 font-bold text-[10px] rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer select-none"
              >
                🏆 Leaderboard
              </button>
            )}
          </div>
        )}

        {/* Subject Grid Selector (Mobile) */}
        <div className="w-full max-w-md mx-auto px-4">
          <div className="grid grid-cols-2 gap-3">
            {subjects.map((sub) => {
              const isActive = sub.active
              const isSelected = selectedSubject === sub.id
              return (
                <button
                  key={sub.id}
                  disabled={!isActive}
                  onClick={() => handleSubjectChange(sub.id)}
                  className={`p-3 rounded-2xl flex items-center gap-2.5 transition-all text-left ${
                    isActive
                      ? isSelected
                        ? 'cyber-subject-btn-active'
                        : 'cyber-subject-btn'
                      : 'bg-slate-950/20 border border-slate-900/30 text-slate-655 cursor-not-allowed opacity-40'
                  }`}
                >
                  {/* Left Icon Square */}
                  <div className={`w-9 h-9 rounded-xl bg-slate-950 border flex items-center justify-center text-lg shrink-0 transition-colors ${
                    isSelected ? 'border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.4)] text-cyan-400' : 'border-slate-800 text-slate-400'
                  }`}>
                    {sub.icon}
                  </div>
                  {/* Right Subject Labels */}
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-[11px] sm:text-xs text-white block leading-tight truncate">
                      {sub.name}
                    </span>
                    <span className="text-[8px] text-slate-400 block leading-tight truncate mt-0.5">
                      {sub.nameEn}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Grade Levels Panel (Mobile) */}
        {currentSubject && currentSubject.active && (
          <div className="w-full max-w-md mx-auto cyber-grade-panel rounded-2xl p-4 mx-4">
            <div className="space-y-3.5">
              {/* Primary Grades Row */}
              {grades.some(g => g.id.startsWith('P') && (currentSubject.allowed_grades || []).includes(g.id)) && (
                <div className="grid grid-cols-6 gap-2 text-center">
                  {grades.filter(g => g.id.startsWith('P') && (currentSubject.allowed_grades || []).includes(g.id)).map((g) => {
                    if (!user && g.id !== 'P1') return null
                    const isSelected = selectedGrade === g.id
                    return (
                      <button
                        key={g.id}
                        onClick={() => setSelectedGrade(g.id)}
                        className={`py-2 px-1 rounded-lg text-[10px] font-black transition-all cursor-pointer text-center ${
                          isSelected
                            ? 'cyber-grade-btn-active'
                            : 'cyber-grade-btn text-slate-450'
                        }`}
                      >
                        {g.label}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Secondary Grades Row */}
              {user && grades.some(g => g.id.startsWith('M') && (currentSubject.allowed_grades || []).includes(g.id)) && (
                <div className="grid grid-cols-6 gap-2 text-center">
                  {grades.filter(g => g.id.startsWith('M') && (currentSubject.allowed_grades || []).includes(g.id)).map((g) => {
                    const isSelected = selectedGrade === g.id
                    return (
                      <button
                        key={g.id}
                        onClick={() => setSelectedGrade(g.id)}
                        className={`py-2 px-1 rounded-lg text-[10px] font-black transition-all cursor-pointer text-center ${
                          isSelected
                            ? 'cyber-grade-btn-active'
                            : 'cyber-grade-btn text-slate-450'
                        }`}
                      >
                        {g.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dynamic Category Selector (Mobile) */}
        {currentSubject && currentSubject.active && availableCategories.length > 1 && (
          <div className="w-full max-w-md mx-auto bg-slate-950/40 border border-slate-900 rounded-2xl p-4 mx-4">
            <label className="block text-[8px] font-black text-slate-455 tracking-widest uppercase mb-2.5 text-left">
              {currentSubject.id === 'Mathematics' ? 'โหมดฝึกซ้อม (Practice Mode)' : 'หมวดหมู่ (Category)'}
            </label>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              {availableCategories.map((cat, index) => {
                const isLast = index === availableCategories.length - 1
                const isOdd = availableCategories.length % 2 !== 0
                const colors = getCategoryColors(selectedSubject)
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`py-2 px-3 rounded-xl font-bold transition-all cursor-pointer text-center ${
                      isLast && isOdd ? 'col-span-2' : ''
                    } ${selectedCategory === cat.id ? colors.active : colors.default}`}
                  >
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Play Game Button (Mobile) */}
        <div className="w-full max-w-md mx-auto flex flex-col gap-1 items-center px-4">
          <button
            onClick={() => onStartGame(selectedSubject, selectedCategory, selectedGrade)}
            className="w-full py-4 rounded-full cyber-play-btn text-white font-display font-extrabold text-xl sm:text-2xl uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-[0_0_20px_rgba(6,182,212,0.5)] hover:scale-[1.01] active:scale-[0.99]"
          >
            Play Game
          </button>
          <span className="text-[9px] text-slate-500 font-medium text-center mt-1">
            {user 
              ? `🟢 โหมดสมาชิก: เล่นโจทย์จริงตามการตั้งค่าจากแผง Admin` 
              : `🟡 โหมดผู้เล่นทั่วไป (Demo): จำกัดการเล่นทดลองเพียง 3 ข้อเท่านั้น`
            }
          </span>
        </div>

        {/* Camera settings & switches (Mobile) */}
        <div className="w-full max-w-md mx-auto flex items-center justify-between px-7 mt-1">
          <button 
            onClick={() => setShowCameraSettings(true)}
            className="text-[9px] font-bold text-slate-450 hover:text-white uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>⚙️</span> Camera Settings
          </button>
          
          <div className="flex gap-4 items-center">
            {/* Mirror Toggle */}
            <div className="cyber-switch-container">
              <div 
                onClick={() => setMirrorHorizontal(!mirrorHorizontal)}
                className={`cyber-switch-track ${mirrorHorizontal ? 'cyber-switch-track-active' : ''}`}
              >
                <div className={`cyber-switch-thumb ${mirrorHorizontal ? 'cyber-switch-thumb-active' : ''}`} />
              </div>
              <span className="cyber-switch-label">Mirror</span>
            </div>

            {/* Sound Toggle */}
            <div className="cyber-switch-container">
              <div 
                onClick={onToggleSound}
                className={`cyber-switch-track ${soundEnabled ? 'cyber-switch-track-active' : ''}`}
              >
                <div className={`cyber-switch-thumb ${soundEnabled ? 'cyber-switch-thumb-active' : ''}`} />
              </div>
              <span className="cyber-switch-label">Sound</span>
            </div>
          </div>
        </div>

        {/* How To Play Toggle link (Mobile) */}
        <button
          onClick={() => setShowHowTo(true)}
          className="text-[9px] text-slate-500 hover:text-cyan-400 font-bold tracking-wider uppercase transition-colors cursor-pointer mb-2"
        >
          ❔ วิธีเล่น (How to Play)
        </button>

      </div>

      {/* How To Play Modal */}
      {showHowTo && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full relative shadow-2xl">
            <h3 className="font-display font-black text-2xl text-white mb-4 flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-secondary" />
              วิธีควบคุมเกมด้วยท่าทาง
            </h3>
            
            <div className="space-y-4 text-sm text-slate-300 text-left leading-relaxed">
              <div className="flex gap-3 items-start bg-slate-800/40 p-3 rounded-xl">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                <p>อนุญาตสิทธิ์เข้าใช้งานกล้อง <strong>Webcam</strong> ของท่านเพื่อเป็นหน้าจอเล่นเกมแบบ Mirror Mode</p>
              </div>

              <div className="flex gap-3 items-start bg-slate-800/40 p-3 rounded-xl">
                <span className="w-6 h-6 rounded-full bg-secondary/20 text-secondary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                <p>ระบบจะตรวจจับ<strong>ปลายนิ้วชี้ (Index Finger)</strong> ของท่านเป็นเป้าชี้คำตอบบนหน้าจอ</p>
              </div>

              <div className="flex gap-3 items-start bg-slate-800/40 p-3 rounded-xl">
                <span className="w-6 h-6 rounded-full bg-accent/20 text-accent font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                <p><strong>Hover Selection:</strong> เลื่อนปลายนิ้วไปชี้เหนือปุ่มคำตอบที่ต้องการค้างไว้จนระบบนับถอยหลัง <strong>3.. 2.. 1..</strong> ครบเพื่อเลือกคำตอบ</p>
              </div>
              
              <div className="text-xs text-warning bg-warning/5 border border-warning/10 p-3 rounded-xl mt-2">
                <strong>💡 คำแนะนำสำหรับการจำลอง (Hover Simulation Mode):</strong> ในกรณีที่ยังไม่ได้เชื่อมต่อกล้องหรือใน Phase นี้ ท่านสามารถใช้เมาส์เลื่อนชี้เหนือตัวเลือกค้างไว้เพื่อดูตัวเลขนับถอยหลังเสมือนการส่องมือได้!
              </div>
            </div>

            <button
              onClick={() => setShowHowTo(false)}
              className="mt-6 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-semibold text-sm transition-all cursor-pointer"
            >
              เข้าใจแล้ว ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    {/* Camera Settings Modal */}
      {showCameraSettings && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full relative shadow-2xl">
            <button
              onClick={() => setShowCameraSettings(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-display font-black text-2xl text-white mb-4 flex items-center gap-2">
              <Settings className="w-6 h-6 text-secondary animate-spin [animation-duration:15s]" />
              ตั้งค่ากล้อง (Camera Settings)
            </h3>

            {/* Live Camera Preview */}
            <div className="w-full aspect-[16/9] rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden relative shadow-inner mb-4 flex items-center justify-center">
              {showCameraSettings && (
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover z-0"
                  style={{
                    transform: `rotate(${cameraRotation}deg) ${mirrorHorizontal ? 'scaleX(-1)' : 'scaleX(1)'}`,
                    opacity: webcamStatus === 'active' ? (virtualCameraOutput ? 1 : 0.92) : 0
                  }}
                />
              )}
              
              {/* Overlays */}
              <div className="absolute inset-0 bg-gradient-to-b from-slate-900/10 to-slate-950/40 z-0 pointer-events-none" />
              
              {webcamStatus === 'loading' && (
                <div className="flex flex-col items-center gap-2 text-slate-400 z-10">
                  <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">กำลังเปิดกล้อง...</span>
                </div>
              )}

              {webcamStatus === 'error' && (
                <div className="flex flex-col items-center gap-1.5 text-danger z-10 px-4 text-center">
                  <span className="text-xs font-bold uppercase">ไม่สามารถเปิดกล้องได้</span>
                  <p className="text-[9px] text-slate-400 leading-normal">
                    โปรดอนุญาตสิทธิ์เข้าใช้งานกล้องบน Browser ของท่าน
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4 text-left">
              <div>
                <span className="text-[11px] font-black text-slate-400 tracking-wider uppercase mb-2 block">Rotate Image (หมุนภาพกล้อง)</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[0, 90, 180, 270].map(angle => (
                    <button
                      key={angle}
                      onClick={() => setCameraRotation(angle)}
                      className={`h-9 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        cameraRotation === angle
                          ? 'bg-primary text-white'
                          : 'bg-slate-850 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      {angle}°
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-2">
                <label className="flex items-center justify-between gap-3 py-2 cursor-pointer">
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">Mirror Mode</span>
                    <span className="text-[10px] text-slate-500 block">สลับภาพกล้องซ้าย-ขวา</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={mirrorHorizontal}
                    onChange={e => setMirrorHorizontal(e.target.checked)}
                    className="h-5 w-5 accent-secondary"
                  />
                </label>

                <label className="flex items-center justify-between gap-3 py-2 cursor-pointer">
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">Virtual Camera Output</span>
                    <span className="text-[10px] text-slate-500 block">แสดงผลกล้องตามสเกลจริง</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={virtualCameraOutput}
                    onChange={e => setVirtualCameraOutput(e.target.checked)}
                    className="h-5 w-5 accent-secondary"
                  />
                </label>
              </div>
            </div>

            <button
              onClick={() => setShowCameraSettings(false)}
              className="mt-6 w-full py-2.5 rounded-xl bg-gradient-to-r from-secondary to-accent text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-secondary/20 hover:scale-[1.01] transition-all cursor-pointer"
            >
              บันทึกและปิด (Save & Close)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
