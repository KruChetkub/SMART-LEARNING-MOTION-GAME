import React, { useState, useEffect, useRef } from 'react'
import { Play, BookOpen, HelpCircle, Sparkles, Volume2, VolumeX, Settings, X, LogIn } from 'lucide-react'
import { motion } from 'framer-motion'
import { subjectRegistry } from '../data/subjects'
import type { SubjectId } from '../types/game'
import { getSubjectCategories } from '../data/questions'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

interface HomeScreenProps {
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
}

const GRADE_LEVELS = [
  { id: 'P1', label: 'ป.1', name: 'ประถมศึกษาปีที่ 1' },
  { id: 'P2', label: 'ป.2', name: 'ประถมศึกษาปีที่ 2' },
  { id: 'P3', label: 'ป.3', name: 'ประถมศึกษาปีที่ 3' },
  { id: 'P4', label: 'ป.4', name: 'ประถมศึกษาปีที่ 4' },
  { id: 'P5', label: 'ป.5', name: 'ประถมศึกษาปีที่ 5' },
  { id: 'P6', label: 'ป.6', name: 'ประถมศึกษาปีที่ 6' },
  { id: 'M1', label: 'ม.1', name: 'มัธยมศึกษาปีที่ 1' },
  { id: 'M2', label: 'ม.2', name: 'มัธยมศึกษาปีที่ 2' },
  { id: 'M3', label: 'ม.3', name: 'มัธยมศึกษาปีที่ 3' },
  { id: 'M4', label: 'ม.4', name: 'มัธยมศึกษาปีที่ 4' },
  { id: 'M5', label: 'ม.5', name: 'มัธยมศึกษาปีที่ 5' },
  { id: 'M6', label: 'ม.6', name: 'มัธยมศึกษาปีที่ 6' }
]

export const HomeScreen: React.FC<HomeScreenProps> = ({
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
  onLogout
}) => {
  const [showHowTo, setShowHowTo] = useState(false)
  const [showCameraSettings, setShowCameraSettings] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<SubjectId>('Mathematics')
  const [selectedGrade, setSelectedGrade] = useState<string>('P1')
  const [selectedCategory, setSelectedCategory] = useState('mixed')
  const [availableCategories, setAvailableCategories] = useState<{ id: string; label: string; labelEn: string }[]>([])

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
            
            const config = subjectRegistry.find(s => s.id === selectedSubject)
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
  const currentSubject = subjectRegistry.find(s => s.id === selectedSubject)

  // Reset category when switching subjects
  const handleSubjectChange = (subjectId: SubjectId) => {
    setSelectedSubject(subjectId)
    setSelectedCategory('mixed')
  }

  // Category color palette per subject
  const categoryColors: Record<SubjectId, { active: string; default: string }> = {
    Mathematics: { active: 'bg-secondary text-white shadow-md', default: 'bg-slate-800/50 hover:bg-slate-800 text-slate-400' },
    Thai: { active: 'bg-orange-500 text-white shadow-md', default: 'bg-slate-800/50 hover:bg-slate-800 text-slate-400' },
    English: { active: 'bg-pink-500 text-white shadow-md', default: 'bg-slate-800/50 hover:bg-slate-800 text-slate-400' },
    Science: { active: 'bg-emerald-500 text-white shadow-md', default: 'bg-slate-800/50 hover:bg-slate-800 text-slate-400' },
    Social: { active: 'bg-violet-500 text-white shadow-md', default: 'bg-slate-800/50 hover:bg-slate-800 text-slate-400' },
  }

  // Helper to calculate leveling thresholds
  const getLevelFromExp = (totalExp: number) => {
    let level = 1
    let expNeeded = 1000
    let accumulated = 0
    
    while (totalExp >= accumulated + expNeeded) {
      accumulated += expNeeded
      level += 1
      expNeeded = level * 1000
    }
    
    return {
      level,
      nextLevelExpThreshold: accumulated + expNeeded,
      prevLevelExpThreshold: accumulated
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col justify-between min-h-[85svh] px-4 py-6">
      
      {/* Header Title */}
      <div className="w-full flex justify-center mb-6">
        <motion.div 
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="text-center relative w-full max-w-md"
        >
          <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-2xl opacity-40 transform scale-125 -z-10" />
          <div className="glass-panel px-6 py-4 rounded-2xl border-slate-700/50">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-secondary flex items-center justify-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-warning animate-spin [animation-duration:8s]" />
              Active Learning Arcade
            </span>
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-none">
              SMART LEARNING
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-secondary to-accent mt-1.5">
                MOTION GAME
              </span>
            </h1>
          </div>
        </motion.div>
      </div>

      {/* Split Grid Content */}
      <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-[1fr_1.6fr] gap-6 md:gap-8 items-start my-2">
        
        {/* Left Column: Action Buttons */}
        <div className="w-full flex flex-col gap-4 max-w-md mx-auto md:max-w-none">
          {/* User Profile Card */}
          <div className="glass-panel p-4 rounded-2xl border-slate-700/50 mb-1 flex flex-col gap-3">
            {user ? (
              <>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3 w-full min-w-0">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Profile" className="w-10 h-10 rounded-full border border-secondary shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-secondary/20 border border-secondary flex items-center justify-center font-bold text-white text-lg shrink-0">
                        {profile?.display_name?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0 text-left">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block leading-none mb-0.5">ผู้เล่น</span>
                      <span className="font-semibold text-sm text-white truncate block leading-tight">{profile?.display_name || user.email}</span>
                      <span className="text-[9px] text-secondary font-semibold block leading-tight">{profile?.role === 'superadmin' ? 'Super Admin' : profile?.role === 'admin' ? 'Admin' : 'ผู้เล่นทั่วไป'}</span>
                    </div>
                  </div>
                  <button
                    onClick={onLogout}
                    className="text-xs bg-slate-800 hover:bg-slate-750 text-slate-350 hover:text-white px-2.5 py-1.5 rounded-lg font-bold transition-colors cursor-pointer select-none"
                  >
                    ออก
                  </button>
                </div>

                {/* Level & ROV Rank stats */}
                <div className="pt-2.5 border-t border-slate-800 space-y-2 text-left">
                  {/* EXP progress */}
                  <div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-1">
                      <span>พลังงาน Lvl {profile?.level || 1}</span>
                      <span>{(profile?.exp || 0)} EXP</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                      {(() => {
                        const currentExp = profile?.exp || 0
                        const lvlInfo = getLevelFromExp(currentExp)
                        const pct = ((currentExp - lvlInfo.prevLevelExpThreshold) / (lvlInfo.nextLevelExpThreshold - lvlInfo.prevLevelExpThreshold)) * 100
                        return (
                          <div 
                            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full" 
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        )
                      })()}
                    </div>
                  </div>

                  {/* Rank Tier & Stars */}
                  <div className="flex items-center justify-between py-1 bg-slate-950/40 px-2.5 rounded-xl border border-slate-900/50">
                    <span className="text-[10px] font-bold text-slate-400">แร้งค์ปัจจุบัน:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-white">{profile?.rank_tier || 'Bronze III'}</span>
                      <div className="flex gap-0.5 items-center">
                        {(() => {
                          const stars = profile?.rank_stars || 0
                          const inPromotion = profile?.is_in_promotion || false
                          if (inPromotion) {
                            return <span className="text-[8px] font-black text-warning bg-warning/10 border border-warning/30 px-1.5 py-0.5 rounded animate-pulse">PROMO 🎯</span>
                          }
                          const starList = []
                          for (let i = 0; i < 3; i++) {
                            starList.push(
                              <span key={i} className={`text-sm leading-none ${i < stars ? 'text-amber-400' : 'text-slate-700'}`}>
                                ★
                              </span>
                            )
                          }
                          return starList
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Active Quest Notice */}
                  {profile?.is_in_promotion && (
                    <div className="bg-warning/5 border border-warning/15 rounded-xl p-2.5">
                      <span className="text-[8px] font-black text-warning uppercase block tracking-wider mb-0.5">🎯 ภารกิจเลื่อนแร้งค์:</span>
                      <p className="text-[9px] text-slate-350 leading-relaxed font-medium">
                        {(() => {
                          if (profile.rank_tier === 'Bronze I') return 'ตอบถูกติดต่อกัน 5 ข้อ (Combo 5x) ในเกมเดียว'
                          if (profile.rank_tier === 'Silver I') return 'เล่นจบเกมโดยได้ความแม่นยำ 90% ขึ้นไป'
                          if (profile.rank_tier === 'Gold I') return 'ทำคะแนนรวมให้ได้ 80 คะแนนขึ้นไป'
                          if (profile.rank_tier === 'Platinum I') return 'ตอบถูก 100% เต็มในการเล่นแบบ 10 ข้อขึ้นไป'
                          if (profile.rank_tier === 'Diamond I') return 'ทำคอมโบสูงสุด 10x และได้คะแนนรวม 95 คะแนนขึ้นไป'
                          return ''
                        })()}
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2 w-full text-left">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">สมาชิกระบบ</span>
                <p className="text-[11px] text-slate-400 leading-normal mb-1">ล็อกอินเพื่อบันทึกสถิติ คะแนนสูงสุด และตั้งค่ากล้องของคุณ!</p>
                <button
                  onClick={onLogin}
                  className="w-full py-2.5 bg-gradient-to-r from-primary to-secondary hover:from-primary/95 hover:to-secondary/95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shadow-md select-none border-transparent"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>เข้าสู่ระบบ / สมัครสมาชิก</span>
                </button>
              </div>
            )}
          </div>

          <span className="text-xs font-bold text-slate-400 tracking-wider uppercase hidden md:block text-left mb-1">
            แผงควบคุม (Control Panel)
          </span>
          
          <div className="flex flex-col gap-1 w-full">
            <button
              onClick={() => onStartGame(selectedSubject, selectedCategory, selectedGrade)}
              className="w-full py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-primary via-blue-600 to-secondary hover:from-blue-600 hover:to-cyan-500 text-white font-display font-extrabold text-xl sm:text-2xl shadow-xl shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <Play className="w-6 h-6 fill-white" />
              เข้าสู่เกม (Play Game)
            </button>
            <span className="text-[10px] text-slate-400 font-semibold text-center mt-1">
              {user 
                ? `🟢 โหมดสมาชิก: เล่นโจทย์จริงตามการตั้งค่าจากแผง Admin` 
                : `🟡 โหมดผู้เล่นทั่วไป (Demo): จำกัดการเล่นทดลองเพียง 3 ข้อเท่านั้น`
              }
            </span>
          </div>

          <button
            onClick={() => setShowCameraSettings(true)}
            className="w-full py-3.5 bg-slate-900/80 border border-slate-700/60 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shadow-md"
          >
            <Settings className="w-4 h-4 text-secondary animate-pulse" />
            ตั้งค่ากล้อง (Camera Settings)
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowHowTo(true)}
              className="py-3 px-4 rounded-xl glass-panel-interactive text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-secondary" />
              วิธีเล่น (How to Play)
            </button>
            <button
              onClick={onToggleSound}
              className="py-3 px-4 rounded-xl glass-panel-interactive text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-accent" />
                  <span>เปิดเสียง (Sound On)</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-slate-500" />
                  <span>ปิดเสียง (Sound Muted)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Subject Selector & Practice Mode */}
        <div className="w-full flex flex-col gap-5 max-w-md mx-auto md:max-w-none">
          {/* Selected Subject Display */}
          <div className="w-full">
            <label className="block text-xs font-bold text-slate-400 tracking-wider uppercase mb-3 text-center md:text-left">
              เลือกวิชาเรียน (Select Subject)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {subjectRegistry.map((sub) => (
                <button
                  key={sub.id}
                  disabled={!sub.active}
                  onClick={() => handleSubjectChange(sub.id)}
                  className={`w-full p-4 rounded-xl font-display font-bold text-xs sm:text-sm tracking-wide text-left flex items-center justify-between transition-all min-w-0 ${
                    sub.active
                      ? selectedSubject === sub.id
                        ? 'bg-gradient-to-r ' + sub.color + ' text-white shadow-lg shadow-primary/20 scale-[1.01] border-transparent'
                        : 'bg-slate-800/80 border border-slate-700/50 hover:bg-slate-750 text-slate-300 hover:translate-x-1'
                      : 'bg-slate-900/40 border border-slate-800/30 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base shrink-0">{sub.icon}</span>
                    <span className="truncate">{sub.name} ({sub.nameEn})</span>
                  </div>
                  {sub.active ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/20 text-white uppercase font-black shrink-0">
                      Ready
                    </span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-950/60 text-slate-600 uppercase font-black shrink-0">
                      Soon
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Grade Level Selector */}
          {currentSubject && currentSubject.active && (
            <div className="w-full bg-slate-900/40 border border-slate-800/40 rounded-2xl p-4 text-left relative overflow-hidden">
              <label className="block text-[10px] font-black text-slate-500 tracking-widest uppercase mb-3 text-center md:text-left">
                เลือกระดับชั้นเรียน (Grade Level)
              </label>
              
              <div className="space-y-3">
                {/* Primary (ป.1 - ป.6) */}
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">ประถมศึกษา (Primary)</span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-xs">
                    {GRADE_LEVELS.filter(g => g.id.startsWith('P')).map((g) => {
                      // Guests can only see and choose P1
                      if (!user && g.id !== 'P1') return null
                      
                      const colors = categoryColors[selectedSubject]
                      return (
                        <button
                          key={g.id}
                          onClick={() => setSelectedGrade(g.id)}
                          className={`py-2 px-1 rounded-xl font-bold transition-all cursor-pointer text-center ${
                            selectedGrade === g.id
                              ? colors.active
                              : colors.default
                          }`}
                        >
                          {g.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Secondary (ม.1 - ม.6) — Hidden for guests */}
                {user && (
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">มัธยมศึกษา (Secondary)</span>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-xs">
                      {GRADE_LEVELS.filter(g => g.id.startsWith('M')).map((g) => {
                        const colors = categoryColors[selectedSubject]
                        return (
                          <button
                            key={g.id}
                            onClick={() => setSelectedGrade(g.id)}
                            className={`py-2 px-1 rounded-xl font-bold transition-all cursor-pointer text-center ${
                              selectedGrade === g.id
                                ? colors.active
                                : colors.default
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

              {!user && (
                <div className="mt-3 pt-3 border-t border-slate-800/60 text-center md:text-left">
                  <span className="text-[10px] font-bold text-secondary tracking-wide">
                    💡 ลงทะเบียน/เข้าสู่ระบบ เพื่อเล่นระดับชั้นเรียน ป.2 - ม.6
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Dynamic Category Selector — shows for any active subject with categories */}
          {currentSubject && currentSubject.active && availableCategories.length > 1 && (
            <div className="w-full bg-slate-900/40 border border-slate-800/40 rounded-2xl p-4 text-left">
              <label className="block text-[10px] font-black text-slate-500 tracking-widest uppercase mb-3 text-center md:text-left">
                {currentSubject.id === 'Mathematics' ? 'โหมดฝึกซ้อม (Practice Mode)' : 'หมวดหมู่ (Category)'}
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {availableCategories.map((cat, index) => {
                  const isLast = index === availableCategories.length - 1
                  const isOdd = availableCategories.length % 2 !== 0
                  const colors = categoryColors[selectedSubject]
                  
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`py-2.5 px-3 rounded-xl font-bold transition-all cursor-pointer text-center ${
                        isLast && isOdd ? 'col-span-2' : ''
                      } ${
                        selectedCategory === cat.id
                          ? colors.active
                          : colors.default
                      }`}
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
