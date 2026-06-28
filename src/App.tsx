import { useState, useEffect, useRef } from 'react'
import { HomeScreen } from './components/HomeScreen'
import { GameScreen } from './components/GameScreen'
import { AdminScreen } from './components/AdminScreen'
import { AuthModal } from './components/AuthModal'
import { PWAInstallPrompt } from './components/PWAInstallPrompt'
import type { ScreenState, GameStats, AnswerRecord, SubjectId, GradeLevel } from './types/game'
import { getSubjectQuestions } from './data/questions'
import { subjectRegistry } from './data/subjects'
import { supabase, isSupabaseConfigured } from './lib/supabase'
import { saveGameSession, getLeaderboard } from './lib/db'

const djb2Hash = (str: string): number => {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i)
  }
  return hash >>> 0
}

const obfuscateAndShuffleQuestions = (rawQuestions: any[]): any[] => {
  return rawQuestions.map(q => {
    const originalChoices = [...q.choices]
    const originalAnswerIndex = q.answerIndex !== undefined ? q.answerIndex : q.answer_index
    
    if (originalAnswerIndex === undefined) {
      // Online mode: answers are not fetched from DB for security, only choices are shuffled
      const shuffledChoices = [...originalChoices].sort(() => 0.5 - Math.random())
      return {
        id: q.id,
        subject: q.subject,
        category: q.category,
        equation: q.equation,
        choices: shuffledChoices
      }
    }
    
    // Offline / fallback mode: answers are present locally and hashed for basic protection
    const correctText = originalChoices[originalAnswerIndex]
    const salt = Math.random().toString(36).substring(2, 7)
    const correctHash = djb2Hash(correctText + salt)
    const shuffledChoices = [...originalChoices].sort(() => 0.5 - Math.random())
    
    return {
      id: q.id,
      subject: q.subject,
      category: q.category,
      equation: q.equation,
      choices: shuffledChoices,
      salt,
      correctHash
    }
  })
}

const RANK_TIERS = [
  'Bronze III', 'Bronze II', 'Bronze I',
  'Silver III', 'Silver II', 'Silver I',
  'Gold III', 'Gold II', 'Gold I',
  'Platinum III', 'Platinum II', 'Platinum I',
  'Diamond III', 'Diamond II', 'Diamond I',
  'Conqueror'
]

const getNextRank = (currentRank: string): string | null => {
  const idx = RANK_TIERS.indexOf(currentRank)
  if (idx === -1 || idx === RANK_TIERS.length - 1) return null
  return RANK_TIERS[idx + 1]
}

const getQuestDetails = (currentRank: string) => {
  if (currentRank === 'Bronze I') {
    return { type: 'COMBO', target: 5, description: 'ตอบถูกติดต่อกัน 5 ข้อ (Combo 5x) ในเกมเดียว' }
  }
  if (currentRank === 'Silver I') {
    return { type: 'ACCURACY', target: 90, description: 'เล่นจบเกมโดยได้ความแม่นยำ 90% ขึ้นไป' }
  }
  if (currentRank === 'Gold I') {
    return { type: 'SCORE', target: 80, description: 'ทำคะแนนรวมให้ได้ 80 คะแนนขึ้นไป' }
  }
  if (currentRank === 'Platinum I') {
    return { type: 'PERFECT_10', target: 100, description: 'ตอบถูก 100% เต็มในการเล่นแบบ 10 ข้อขึ้นไป' }
  }
  if (currentRank === 'Diamond I') {
    return { type: 'CHAMPION', target: 95, description: 'ทำคอมโบสูงสุด 10x และได้คะแนนรวม 95 คะแนนขึ้นไป' }
  }
  return null
}

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

function App() {
  const [screen, setScreen] = useState<ScreenState>('HOME')
  const gameScreenRef = useRef<any>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [activeSubject, setActiveSubject] = useState<SubjectId>('Mathematics')
  const [activeCategory, setActiveCategory] = useState('mixed')
  const [activeGradeLevel, setActiveGradeLevel] = useState<string>('P1')
  const [activeTimeLimit, setActiveTimeLimit] = useState<number>(15)
  const [activeQuestions, setActiveQuestions] = useState(getSubjectQuestions('Mathematics', 'mixed', 5))

  // Camera settings state (lifted from GameScreen)
  const [cameraRotation, setCameraRotation] = useState(0)
  const [mirrorHorizontal, setMirrorHorizontal] = useState(false)
  const [virtualCameraOutput, setVirtualCameraOutput] = useState(false)
  
  // Overall match tracking
  const [startTime, setStartTime] = useState<number>(0)
  const [gameStats, setGameStats] = useState<GameStats>({
    totalScore: 0,
    correctCount: 0,
    wrongCount: 0,
    accuracy: 0,
    timeUsed: 0,
    earnedBadge: 'Bronze',
    rank: 'ผู้เริ่มต้นฝึกฝน (Novice Learner)',
    maxCombo: 0
  })
  const [lastGameResult, setLastGameResult] = useState<any>(null)

  const [leaderboardOpen, setLeaderboardOpen] = useState(false)
  const [leaderboardData, setLeaderboardData] = useState<any[]>([])
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)

  const fetchLeaderboardData = async () => {
    setLeaderboardLoading(true)
    try {
      const data = await getLeaderboard(10)
      setLeaderboardData(data)
    } catch (e) {
      console.error('Failed to fetch leaderboard:', e)
    } finally {
      setLeaderboardLoading(false)
    }
  }

  const dbConnected = isSupabaseConfigured()

  // Dynamic subjects and grades lists with static fallbacks
  const [subjects, setSubjects] = useState<any[]>(subjectRegistry)
  const [grades, setGrades] = useState<GradeLevel[]>([
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
  ])

  // Game settings from Supabase
  const [gameSettings, setGameSettingsList] = useState<Record<string, { timeLimit: number; questionsPerGame: number }>>({})

  const fetchDynamicSubjectsAndGrades = async () => {
    let currentSubjects = [...subjectRegistry]

    if (dbConnected) {
      try {
        // Fetch subjects
        const { data: dbSubjects, error: subError } = await supabase
          .from('subjects')
          .select('*')
          .order('created_at', { ascending: true })

        if (!subError && dbSubjects && dbSubjects.length > 0) {
          currentSubjects = dbSubjects.map(sub => ({
            id: sub.id,
            name: sub.name,
            nameEn: sub.name_en,
            icon: sub.icon,
            color: sub.color,
            categories: typeof sub.categories === 'string' ? JSON.parse(sub.categories) : sub.categories,
            active: sub.is_active,
            allowed_grades: sub.allowed_grades
          }))
          setSubjects(currentSubjects)
        }

        // Fetch grades
        const { data: dbGrades, error: gradeError } = await supabase
          .from('grades')
          .select('*')
          .order('created_at', { ascending: true })

        if (!gradeError && dbGrades && dbGrades.length > 0) {
          setGrades(dbGrades)
        }
      } catch (e) {
        console.error('Failed to fetch dynamic subjects/grades:', e)
      }
    }

    // Fetch game settings and build initial keys map
    try {
      const settingsMap: Record<string, { timeLimit: number; questionsPerGame: number }> = {}
      currentSubjects.forEach(sub => {
        settingsMap[sub.id] = { timeLimit: 15, questionsPerGame: 5 }
      })

      if (dbConnected) {
        const { data, error } = await supabase
          .from('game_settings')
          .select('subject, time_limit, questions_per_game')
        
        if (!error && data) {
          data.forEach(item => {
            settingsMap[item.subject] = {
              timeLimit: item.time_limit,
              questionsPerGame: item.questions_per_game
            }
          })
        }
      }
      setGameSettingsList(settingsMap)
    } catch (e) {
      console.error('Failed to build game settings mapping:', e)
    }
  }

  // Load configuration on boot
  useEffect(() => {
    fetchDynamicSubjectsAndGrades()
  }, [dbConnected])

  // Auth states
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  const fetchProfile = async (userId: string) => {
    if (!dbConnected) return
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (!error && data) {
        setProfile(data)
      } else if (error) {
        console.warn('Profile not found, trigger might still be running:', error.message)
        // Retry once after 1 second if profile is not created yet
        setTimeout(async () => {
          const { data: retryData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()
          if (retryData) setProfile(retryData)
        }, 1000)
      }
    } catch (e) {
      console.error('Failed to fetch user profile:', e)
    }
  }

  const updateProfileRankAndExp = async (stats: GameStats, earnedExp: number) => {
    if (!dbConnected || !user) return null
    try {
      const { data: curProfile, error: fetchErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (fetchErr || !curProfile) return null

      let currentExp = (curProfile.exp || 0) + earnedExp
      const levelInfo = getLevelFromExp(currentExp)
      let currentLevel = levelInfo.level
      
      let currentRank = curProfile.rank_tier || 'Bronze III'
      let currentStars = curProfile.rank_stars || 0
      let inPromotion = curProfile.is_in_promotion || false
      let questType = curProfile.promotion_quest_type || null
      let questTarget = curProfile.promotion_quest_target || 0
      let questProgress = curProfile.promotion_quest_progress || 0
      
      let questCleared = false
      let rankPromoted = false
      let originalRank = currentRank

      if (inPromotion) {
        let pass = false
        if (questType === 'COMBO' && stats.maxCombo >= questTarget) {
          pass = true
        } else if (questType === 'ACCURACY' && stats.accuracy >= questTarget) {
          pass = true
        } else if (questType === 'SCORE' && stats.totalScore >= questTarget) {
          pass = true
        } else if (questType === 'PERFECT_10' && stats.accuracy >= questTarget && (stats.correctCount + stats.wrongCount) >= 10) {
          pass = true
        } else if (questType === 'CHAMPION' && stats.maxCombo >= 10 && stats.totalScore >= questTarget) {
          pass = true
        }

        if (pass) {
          questCleared = true
          inPromotion = false
          questType = null
          questTarget = 0
          questProgress = 0
          
          const next = getNextRank(currentRank)
          if (next) {
            currentRank = next
            currentStars = 0
            rankPromoted = true
          }
        }
      } else {
        if (currentRank !== 'Conqueror') {
          let gainedStars = 0
          if (stats.accuracy === 100) {
            gainedStars = 2
          } else if (stats.accuracy >= 70 || stats.totalScore >= 40) {
            gainedStars = 1
          }

          if (gainedStars > 0) {
            currentStars += gainedStars
            
            if (currentStars >= 3) {
              if (currentRank.endsWith('I')) {
                currentStars = 3
                inPromotion = true
                const quest = getQuestDetails(currentRank)
                if (quest) {
                  questType = quest.type
                  questTarget = quest.target
                  questProgress = 0
                }
              } else {
                const next = getNextRank(currentRank)
                if (next) {
                  currentRank = next
                  currentStars = currentStars - 3
                  rankPromoted = true
                }
              }
            }
          }
        }
      }

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          exp: currentExp,
          level: currentLevel,
          rank_tier: currentRank,
          rank_stars: currentStars,
          is_in_promotion: inPromotion,
          promotion_quest_type: questType,
          promotion_quest_target: questTarget,
          promotion_quest_progress: questProgress
        })
        .eq('id', user.id)
      
      if (!updateErr) {
        setProfile((prev: any) => ({
          ...prev,
          exp: currentExp,
          level: currentLevel,
          rank_tier: currentRank,
          rank_stars: currentStars,
          is_in_promotion: inPromotion,
          promotion_quest_type: questType,
          promotion_quest_target: questTarget,
          promotion_quest_progress: questProgress
        }))
        
        return {
          earnedExp,
          levelUp: currentLevel > (curProfile.level || 1),
          rankPromoted,
          originalRank,
          newRank: currentRank,
          questCleared
        }
      }
    } catch (e) {
      console.error('Failed to update rank/exp:', e)
    }
    return null
  }

  const fetchUserSettings = async (userId: string) => {
    if (!dbConnected) return
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (!error && data) {
        setCameraRotation(data.camera_rotation)
        setMirrorHorizontal(data.mirror_horizontal)
        setVirtualCameraOutput(data.virtual_camera_output)
        setSoundEnabled(data.sound_enabled)
      }
    } catch (e) {
      console.error('Failed to fetch user settings:', e)
    }
  }

  const syncUserSettings = async (
    rotation: number,
    mirror: boolean,
    virtual: boolean,
    sound: boolean
  ) => {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!dbConnected || !currentUser) return
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: currentUser.id,
          camera_rotation: rotation,
          mirror_horizontal: mirror,
          virtual_camera_output: virtual,
          sound_enabled: sound,
          updated_at: new Date().toISOString()
        })
      if (error) {
        console.error('Failed to sync settings to Supabase:', error.message)
      }
    } catch (e) {
      console.error('Failed to sync settings:', e)
    }
  }

  const updateCameraRotation = (val: number) => {
    setCameraRotation(val)
    syncUserSettings(val, mirrorHorizontal, virtualCameraOutput, soundEnabled)
  }

  const updateMirrorHorizontal = (val: boolean) => {
    setMirrorHorizontal(val)
    syncUserSettings(cameraRotation, val, virtualCameraOutput, soundEnabled)
  }

  const updateVirtualCameraOutput = (val: boolean) => {
    setVirtualCameraOutput(val)
    syncUserSettings(cameraRotation, mirrorHorizontal, val, soundEnabled)
  }

  const updateSoundEnabled = (val: boolean) => {
    setSoundEnabled(val)
    syncUserSettings(cameraRotation, mirrorHorizontal, virtualCameraOutput, val)
  }

  // Subscribe to auth state changes
  useEffect(() => {
    if (!dbConnected) return

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
        fetchUserSettings(session.user.id)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
        fetchUserSettings(session.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [dbConnected])

  const handleLogin = async () => {
    if (!dbConnected) return
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      })
      if (error) console.error('OAuth sign in error:', error.message)
    } catch (e) {
      console.error('OAuth sign in failed:', e)
    }
  }

  const handleEmailSignIn = async (email: string, pass: string): Promise<{ error?: string }> => {
    if (!dbConnected) return { error: 'ไม่ได้รับการเชื่อมต่อฐานข้อมูล Supabase' }
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: pass
      })
      if (error) {
        return { error: error.message }
      }
      return {}
    } catch (e: any) {
      return { error: e.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' }
    }
  }

  const handleEmailSignUp = async (email: string, pass: string, name: string): Promise<{ error?: string; successMessage?: string }> => {
    if (!dbConnected) return { error: 'ไม่ได้รับการเชื่อมต่อฐานข้อมูล Supabase' }
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            name: name
          }
        }
      })
      if (error) {
        return { error: error.message }
      }
      
      // Check if email confirmation is required (if session is null, verification is needed)
      const isConfirmed = data.session !== null
      if (!isConfirmed) {
        return { successMessage: 'สมัครสมาชิกสำเร็จ! โปรดตรวจสอบอีเมลของคุณเพื่อยืนยันตัวตนก่อนเข้าสู่ระบบ' }
      }
      
      return { successMessage: 'สมัครสมาชิกและเข้าสู่ระบบสำเร็จ!' }
    } catch (e: any) {
      return { error: e.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก' }
    }
  }

  const handleLogout = async () => {
    if (!dbConnected) return
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      // Reset settings states to defaults
      setCameraRotation(0)
      setMirrorHorizontal(false)
      setVirtualCameraOutput(false)
      setSoundEnabled(true)
    } catch (e) {
      console.error('Sign out error:', e)
    }
  }

  // Handle starting a fresh game
  const handleStartGame = async (
    subject: SubjectId,
    category: string,
    gradeLevel: string
  ) => {
    // Request fullscreen immediately on user gesture to avoid activation loss
    gameScreenRef.current?.requestFullscreen()

    // Always fetch the live session from Supabase — never rely on potentially stale React state
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    console.log(`[GameStart] Subject: ${subject}, Category: ${category}, Grade: ${gradeLevel}`)
    console.log('[GameStart] Live session user:', currentUser?.email ?? 'GUEST (no session)')

    setActiveSubject(subject)
    setActiveCategory(category)
    setActiveGradeLevel(gradeLevel)

    let config = { timeLimit: 15, questionsPerGame: 5 }

    if (!currentUser) {
      // Guest/Demo mode: cap at 3 questions
      config = { timeLimit: 15, questionsPerGame: 3 }
      console.log('[GameStart] No live session → Guest Mode (3 questions)')
    } else if (dbConnected) {
      console.log("[GameStart] User is logged in. Querying game_settings from database...")
      try {
        // First attempt: try matching subject & grade_level
        let { data: settingsData, error: settingsError } = await supabase
          .from('game_settings')
          .select('time_limit, questions_per_game')
          .eq('subject', subject)
          .eq('grade_level', gradeLevel)
          .maybeSingle()
        
        // Second attempt: if no specific grade setting found, try fallback to 'All'
        if ((settingsError || !settingsData) && gradeLevel !== 'All') {
          console.log(`[GameStart] Specific setting for grade ${gradeLevel} not found or error, trying fallback to 'All'...`)
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('game_settings')
            .select('time_limit, questions_per_game')
            .eq('subject', subject)
            .eq('grade_level', 'All')
            .maybeSingle()
          if (!fallbackError && fallbackData) {
            settingsData = fallbackData
            settingsError = null
          }
        }
        
        if (!settingsError && settingsData) {
          config = {
            timeLimit: settingsData.time_limit,
            questionsPerGame: settingsData.questions_per_game
          }
          console.log("[GameStart] Loaded database settings:", config)
        } else {
          console.warn("[GameStart] Settings not found or error, using default 5 questions. Error:", settingsError)
          const cached = gameSettings[subject]
          if (cached) {
            config = cached
          }
        }
      } catch (e) {
        console.error('Failed to fetch dynamic game settings, using defaults:', e)
        const cached = gameSettings[subject]
        if (cached) {
          config = cached
        }
      }
    } else {
      console.log("[GameStart] DB not connected, using default or cached settings.")
      const cached = gameSettings[subject]
      if (cached) {
        config = cached
      }
    }

    setActiveTimeLimit(config.timeLimit)

    let questionsList: any[] = []
    if (currentUser && dbConnected) {
      try {
        console.log(`[GameStart] Fetching questions from DB (secure view): subject=${subject}, grade=${gradeLevel}, category=${category}`)
        let query = supabase
          .from('game_questions')
          .select('id, subject, category, equation, choices')
          .eq('subject', subject)
          .eq('grade_level', gradeLevel)

        if (category !== 'mixed') {
          query = query.eq('category', category)
        }

        const { data, error } = await query

        if (!error && data && data.length > 0) {
          questionsList = data.map(q => ({
            id: q.id,
            subject: q.subject as SubjectId,
            category: q.category,
            equation: q.equation,
            choices: q.choices
          }))
          questionsList = [...questionsList].sort(() => 0.5 - Math.random())
          console.log(`[GameStart] DB returned ${questionsList.length} questions.`)
        } else {
          console.warn('[GameStart] DB returned 0 questions or error:', error)
        }
      } catch (e) {
        console.error('[GameStart] DB fetch failed, falling back to offline:', e)
      }
    }

    if (questionsList.length === 0) {
      console.log('[GameStart] Using offline question bank as fallback.')
      questionsList = getSubjectQuestions(subject, category, config.questionsPerGame, gradeLevel)
    } else if (questionsList.length < config.questionsPerGame) {
      const offlineQuestions = getSubjectQuestions(subject, category, config.questionsPerGame * 2, gradeLevel)
      const existingEquations = new Set(questionsList.map(q => q.equation))
      for (const q of offlineQuestions) {
        if (questionsList.length >= config.questionsPerGame) break
        if (!existingEquations.has(q.equation)) questionsList.push(q)
      }
    }

    console.log(`[GameStart] Final question count: ${Math.min(questionsList.length, config.questionsPerGame)} (cap=${config.questionsPerGame})`)
    questionsList = questionsList.slice(0, config.questionsPerGame)

    const processedQuestions = obfuscateAndShuffleQuestions(questionsList)
    setActiveQuestions(processedQuestions)
    setStartTime(Date.now())
    setScreen('GAME')
  }

  // Handle game finished transition
  const handleGameFinished = (records: AnswerRecord[], totalScore: number, maxCombo: number) => {
    if (records.length === 0) {
      console.warn('[GameFinished] Called with empty records — ignoring to prevent crash')
      return
    }

    const durationSeconds = Math.round((Date.now() - startTime) / 1000)
    const correctCount = records.filter(r => r.isCorrect).length
    const wrongCount = records.length - correctCount
    const accuracy = records.length > 0 ? Math.round((correctCount / records.length) * 100) : 0


    // Calculate Badge & Rank titles based on score ranges
    let earnedBadge = 'Bronze'
    let rank = 'ผู้เริ่มต้นฝึกฝน (Novice Mathlet)'

    if (totalScore >= 75) {
      earnedBadge = 'Legend'
      rank = 'ดาวเด่นการเรียนรู้ (Learning Super Star)'
    } else if (totalScore >= 70) {
      earnedBadge = 'Master'
      rank = 'อัจฉริยะการเรียนรู้ (Learning Genius)'
    } else if (totalScore >= 60) {
      earnedBadge = 'Diamond'
      rank = 'ผู้เชี่ยวชาญความรู้ (Knowledge Wizard)'
    } else if (totalScore >= 50) {
      earnedBadge = 'Platinum'
      rank = 'จอมเวทย์แห่งวิชา (Subject Wizard)'
    } else if (totalScore >= 35) {
      earnedBadge = 'Gold'
      rank = 'นักคิดไว (Speedy Thinker)'
    } else if (totalScore >= 20) {
      earnedBadge = 'Silver'
      rank = 'นักแก้โจทย์ (Problem Solver)'
    }

    const finalStats: GameStats = {
      totalScore,
      correctCount,
      wrongCount,
      accuracy,
      timeUsed: durationSeconds,
      earnedBadge,
      rank,
      maxCombo
    }

    // Calculate EXP Earned
    const earnedExp = 100 + (totalScore * 2) + (accuracy === 100 ? 50 : 0) + (maxCombo * 5)

    setLastGameResult(null)
    if (user) {
      updateProfileRankAndExp(finalStats, earnedExp).then(res => {
        if (res) {
          setLastGameResult(res)
        }
      })
    } else {
      // Simulate guest results
      setLastGameResult({
        earnedExp,
        levelUp: false,
        rankPromoted: false,
        originalRank: 'Bronze III',
        newRank: 'Bronze III',
        questCleared: false,
        guest: true
      })
    }

    setGameStats(finalStats)
    saveGameSession(finalStats)
    setScreen('RESULT')
  }

  const handlePlayAgain = async () => {
    // Request fullscreen immediately on user gesture to avoid activation loss
    gameScreenRef.current?.requestFullscreen()

    // Always fetch the live session from Supabase
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    console.log(`[PlayAgain] Subject: ${activeSubject}, Category: ${activeCategory}, Grade: ${activeGradeLevel}`)
    console.log('[PlayAgain] Live session user:', currentUser?.email ?? 'GUEST (no session)')

    let config = { timeLimit: 15, questionsPerGame: 5 }

    if (!currentUser) {
      config = { timeLimit: 15, questionsPerGame: 3 }
      console.log('[PlayAgain] No live session → Guest Mode (3 questions)')
    } else if (dbConnected) {
      try {
        let { data: settingsData, error: settingsError } = await supabase
          .from('game_settings')
          .select('time_limit, questions_per_game')
          .eq('subject', activeSubject)
          .eq('grade_level', activeGradeLevel)
          .maybeSingle()

        if ((settingsError || !settingsData) && activeGradeLevel !== 'All') {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('game_settings')
            .select('time_limit, questions_per_game')
            .eq('subject', activeSubject)
            .eq('grade_level', 'All')
            .maybeSingle()
          if (!fallbackError && fallbackData) {
            settingsData = fallbackData
            settingsError = null
          }
        }

        if (!settingsError && settingsData) {
          config = {
            timeLimit: settingsData.time_limit,
            questionsPerGame: settingsData.questions_per_game
          }
          console.log('[PlayAgain] Settings from DB:', config)
        } else {
          console.warn('[PlayAgain] No settings found, using default 5 questions.')
        }
      } catch (e) {
        console.error('[PlayAgain] Failed to fetch settings:', e)
      }
    }

    setActiveTimeLimit(config.timeLimit)

    let questionsList: any[] = []
    if (currentUser && dbConnected) {
      try {
        let query = supabase
          .from('game_questions')
          .select('id, subject, category, equation, choices')
          .eq('subject', activeSubject)
          .eq('grade_level', activeGradeLevel)

        if (activeCategory !== 'mixed') {
          query = query.eq('category', activeCategory)
        }

        const { data, error } = await query

        if (!error && data && data.length > 0) {
          questionsList = data.map(q => ({
            id: q.id,
            subject: q.subject as SubjectId,
            category: q.category,
            equation: q.equation,
            choices: q.choices
          }))
          questionsList = [...questionsList].sort(() => 0.5 - Math.random())
          console.log(`[PlayAgain] DB returned ${questionsList.length} questions.`)
        } else {
          console.warn('[PlayAgain] DB returned 0 questions or error:', error)
        }
      } catch (e) {
        console.error('[PlayAgain] DB fetch error:', e)
      }
    }

    if (questionsList.length === 0) {
      console.log('[PlayAgain] Using offline question bank as fallback.')
      questionsList = getSubjectQuestions(activeSubject, activeCategory, config.questionsPerGame, activeGradeLevel)
    } else if (questionsList.length < config.questionsPerGame) {
      const offlineQuestions = getSubjectQuestions(activeSubject, activeCategory, config.questionsPerGame * 2, activeGradeLevel)
      const existingEquations = new Set(questionsList.map(q => q.equation))
      for (const q of offlineQuestions) {
        if (questionsList.length >= config.questionsPerGame) break
        if (!existingEquations.has(q.equation)) questionsList.push(q)
      }
    }

    console.log(`[PlayAgain] Final question count: ${Math.min(questionsList.length, config.questionsPerGame)} (cap=${config.questionsPerGame})`)
    questionsList = questionsList.slice(0, config.questionsPerGame)

    const processedQuestions = obfuscateAndShuffleQuestions(questionsList)
    setActiveQuestions(processedQuestions)
    setStartTime(Date.now())
    setScreen('GAME')
  }

  const handleGoHome = () => {
    // Exit fullscreen if active
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => {
        console.warn("Exit fullscreen failed:", err);
      });
    }
    if (user) {
      fetchProfile(user.id)
    }
    setScreen('HOME')
  }


  return (
    <div className={`min-h-screen bg-slate-950 bg-radial-[circle_at_center,_var(--tw-gradient-stops)] from-slate-900 to-slate-950 flex flex-col items-center justify-between relative overflow-hidden ${screen === 'HOME' ? 'p-0' : 'p-4'}`}>
      
      {/* Background Decorative Glow Panels */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Header element visible on Result/Dashboard/Admin screens */}
      {screen !== 'GAME' && screen !== 'HOME' && (
        <header className="w-full max-w-5xl flex justify-between items-center z-10 py-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-slate-950 flex items-center justify-center shadow-lg shadow-primary/10 overflow-hidden border border-slate-800">
              <img src="/Smart Math Motion Logo46.svg" alt="Logo" className="w-7 h-7 object-contain" />
            </div>
            <span className="font-display font-bold text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
              SMART LEARNING
            </span>
          </div>

          <div className="flex items-center gap-3">
            {profile && (profile.role === 'admin' || profile.role === 'superadmin') && screen !== 'ADMIN' && (
              <button
                id="open-admin-btn"
                onClick={() => setScreen('ADMIN')}
                className="text-[11px] bg-red-950/40 border border-red-900/30 text-red-400 px-3 py-1.5 rounded-full font-bold hover:bg-red-900/40 transition-colors flex items-center gap-1.5 select-none cursor-pointer"
              >
                🛠️ Admin Panel
              </button>
            )}
            <button
              id="open-leaderboard-btn"
              onClick={() => {
                fetchLeaderboardData()
                setLeaderboardOpen(true)
              }}
              className="text-[11px] bg-accent/10 border border-accent/30 text-accent px-3 py-1.5 rounded-full font-bold hover:bg-accent/20 transition-colors flex items-center gap-1.5 cursor-pointer select-none"
            >
              🏆 Leaderboard
            </button>
            {!dbConnected && (
              <span className="text-[10px] bg-warning/10 border border-warning/30 text-warning px-2.5 py-1 rounded-full font-bold uppercase">
                Demo
              </span>
            )}
          </div>
        </header>
      )}

      {/* Primary Routing State Machine */}
      <div className={`flex-1 w-full flex z-10 relative ${screen === 'HOME' ? 'items-start justify-center' : 'items-center justify-center'}`}>
        {screen === 'HOME' && (
          <HomeScreen
            subjects={subjects}
            grades={grades}
            onStartGame={handleStartGame}
            soundEnabled={soundEnabled}
            onToggleSound={() => updateSoundEnabled(!soundEnabled)}
            cameraRotation={cameraRotation}
            setCameraRotation={updateCameraRotation}
            mirrorHorizontal={mirrorHorizontal}
            setMirrorHorizontal={updateMirrorHorizontal}
            virtualCameraOutput={virtualCameraOutput}
            setVirtualCameraOutput={updateVirtualCameraOutput}
            user={user}
            profile={profile}
            onLogin={() => setAuthModalOpen(true)}
            onLogout={handleLogout}
            onOpenAdmin={() => setScreen('ADMIN')}
            onOpenLeaderboard={() => {
              fetchLeaderboardData()
              setLeaderboardOpen(true)
            }}
          />
        )}

        <div className={
          screen === 'GAME'
            ? 'w-full flex items-center justify-center'
            : screen === 'RESULT'
              ? 'absolute inset-0 w-full h-full z-0'
              : 'hidden'
        }>
          <GameScreen
            ref={gameScreenRef}
            isActive={screen === 'GAME' || screen === 'RESULT'}
            questions={activeQuestions}
            onGameFinished={handleGameFinished}
            soundEnabled={soundEnabled}
            cameraRotation={cameraRotation}
            mirrorHorizontal={mirrorHorizontal}
            virtualCameraOutput={virtualCameraOutput}
            timeLimit={activeTimeLimit}
            isResultScreen={screen === 'RESULT'}
            resultScreenProps={
              screen === 'RESULT'
                ? {
                    stats: gameStats,
                    onPlayAgain: handlePlayAgain,
                    onGoHome: handleGoHome,
                    soundEnabled: soundEnabled,
                    lastGameResult: lastGameResult,
                    profile: profile
                  }
                : undefined
            }
          />
        </div>

        {screen === 'ADMIN' && (
          <AdminScreen
            subjects={subjects}
            grades={grades}
            onGoHome={handleGoHome}
            onRefreshSettings={fetchDynamicSubjectsAndGrades}
          />
        )}
      </div>

      {/* Universal Footer */}
      <footer className="w-full max-w-5xl text-center text-[10px] text-slate-500 font-medium z-10 py-2">
        <p>© 2026 Smart Math Motion Game. Active Multi-Subject Learning Platform.</p>
      </footer>

      {/* Auth Modal Overlay */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginEmail={handleEmailSignIn}
        onSignUpEmail={handleEmailSignUp}
        onLoginGoogle={handleLogin}
      />

      {/* Public Leaderboard Modal */}
      {leaderboardOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full relative shadow-2xl text-left">
            <button
              onClick={() => setLeaderboardOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer text-lg font-bold"
            >
              ✕
            </button>
            <h3 className="font-display font-black text-2xl text-white mb-2 flex items-center gap-2">
              🏆 ลีดเดอร์บอร์ดผู้เล่นยอดเยี่ยม (Top Players)
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-normal">
              อันดับคะแนนสูงสุดประจำสัปดาห์/เดือนของเหล่านักเรียนผู้เคลื่อนไหวเพื่อการเรียนรู้
            </p>

            <div className="max-h-[350px] overflow-y-auto pr-1 space-y-2">
              {leaderboardLoading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
                  <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">กำลังดึงข้อมูลอันดับ...</span>
                </div>
              ) : leaderboardData.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-10">ยังไม่มีข้อมูลคะแนนจัดอันดับในขณะนี้</p>
              ) : (
                <div className="overflow-hidden border border-slate-800 rounded-xl bg-slate-950/40">
                  <table className="w-full text-xs text-slate-300">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/80">
                        <th className="text-left font-bold px-4 py-2.5">อันดับ</th>
                        <th className="text-left font-bold px-4 py-2.5">ชื่อผู้เล่น</th>
                        <th className="text-center font-bold px-4 py-2.5">คะแนนสูงสุด</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboardData.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-900/60 hover:bg-slate-900/20 transition-colors">
                          <td className="px-4 py-3 font-bold">
                            {idx === 0 ? (
                              <span className="text-base">🥇</span>
                            ) : idx === 1 ? (
                              <span className="text-base">🥈</span>
                            ) : idx === 2 ? (
                              <span className="text-base">🥉</span>
                            ) : (
                              <span className="text-slate-500 ml-1">{idx + 1}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-semibold text-white truncate max-w-[150px]">
                            {item.playerName}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="bg-primary/20 text-primary px-2 py-0.5 rounded font-bold">
                              {item.score}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <button
              onClick={() => setLeaderboardOpen(false)}
              className="mt-6 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-semibold text-xs tracking-wider transition-all cursor-pointer"
            >
              ปิดหน้าต่างอันดับ
            </button>
          </div>
        </div>
      )}

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  )
}

export default App
