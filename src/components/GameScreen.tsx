import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { Check, X, Video, Award, Timer as ClockIcon, Zap } from 'lucide-react'
import type { Question, AnswerRecord } from '../types/game'
import { useMediaPipe } from '../hooks/useMediaPipe'
import { playCorrectSound, playWrongSound, playTickSound } from '../lib/audio'
import { ResultScreen } from './ResultScreen'

const djb2Hash = (str: string): number => {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i)
  }
  return hash >>> 0
}

interface GameScreenProps {
  questions: Question[]
  onGameFinished: (records: AnswerRecord[], totalScore: number, maxCombo: number) => void
  soundEnabled: boolean
  cameraRotation: number
  mirrorHorizontal: boolean
  virtualCameraOutput: boolean
  timeLimit: number
  isActive: boolean
  isResultScreen: boolean
  resultScreenProps?: {
    stats: any
    onPlayAgain: () => void
    onGoHome: () => void
    soundEnabled: boolean
    lastGameResult?: any | null
    profile?: any | null
  }
}

export interface GameScreenRef {
  requestFullscreen: () => void
}

export const GameScreen = forwardRef<GameScreenRef, GameScreenProps>(({
  questions,
  onGameFinished,
  soundEnabled,
  cameraRotation,
  mirrorHorizontal,
  virtualCameraOutput,
  timeLimit,
  isActive,
  isResultScreen,
  resultScreenProps
}, ref) => {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [records, setRecords] = useState<AnswerRecord[]>([])

  const [gameState, setGameState] = useState<'ready' | 'countdown' | 'playing' | 'finished'>('ready')
  const [countdownNumber, setCountdownNumber] = useState<number>(3)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)

  const gameConsoleRef = useRef<HTMLDivElement | null>(null)
  const countdownIntervalRef = useRef<any>(null)

  // Expose requestFullscreen from child to parent
  useImperativeHandle(ref, () => ({
    requestFullscreen: () => {
      if (gameConsoleRef.current) {
        gameConsoleRef.current.requestFullscreen().catch(err => {
          console.warn("Auto-fullscreen request from ref failed:", err)
        })
      }
    }
  }))

  // Reset all game state when questions bank changes (new game starts)
  useEffect(() => {
    setCurrentIdx(0)
    setScore(0)
    setCombo(0)
    setMaxCombo(0)
    setRecords([])
    setGameState('ready')
    setCountdownNumber(3)
  }, [questions])

  // Clean up and prepare GameScreen states when result screen is showing
  useEffect(() => {
    if (isResultScreen) {
      setGameState('finished')
      setFeedback(null)
      setHoverState({ choiceIndex: null, start: false, playAgain: false, goHome: false })
    }
  }, [isResultScreen])
  
  // Timers and hover states
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now())
  const [hoverProgress, setHoverProgress] = useState<number>(0)
  const [startHoverProgress, setStartHoverProgress] = useState<number>(0)
  const [playAgainHoverProgress, setPlayAgainHoverProgress] = useState<number>(0)
  const [goHomeHoverProgress, setGoHomeHoverProgress] = useState<number>(0)

  // Single batched hover state object — prevents 4 separate React re-renders per cursor frame
  const [hoverState, setHoverState] = useState<{
    choiceIndex: number | null
    start: boolean
    playAgain: boolean
    goHome: boolean
  }>({ choiceIndex: null, start: false, playAgain: false, goHome: false })

  const hoveredChoiceIndex = hoverState.choiceIndex
  const hoveredStart = hoverState.start
  const hoveredPlayAgain = hoverState.playAgain
  const hoveredGoHome = hoverState.goHome

  // Feedback states
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'incorrect'; index: number } | null>(null)
  const [comboPop, setComboPop] = useState(false)
  const [speedPop, setSpeedPop] = useState(false)
  const [scorePop, setScorePop] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(timeLimit)
  const activeQuestion = questions[currentIdx] as Question | undefined
  const hasEqualsSign = activeQuestion ? activeQuestion.equation.includes(' = ?') : false
  const equationText = activeQuestion
    ? (hasEqualsSign ? activeQuestion.equation.replace(' = ?', '').trim() : activeQuestion.equation)
    : ''

  // Webcam integration refs/states
  const [webcamStatus, setWebcamStatus] = useState<'loading' | 'active' | 'denied' | 'error'>('loading')
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  const containerRef = useRef<HTMLDivElement | null>(null)
  const lastCoordsRef = useRef<{ x: number; y: number } | null>(null)

  // Direct DOM cursor element manipulation for 60 FPS performance
  const cursorRef = useRef<HTMLDivElement | null>(null)
  const visualCoordsRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const targetCoordsRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  
  // Call MediaPipe Hand Tracking hook
  const cursor = useMediaPipe(videoRef, webcamStatus === 'active', cameraRotation, mirrorHorizontal)

  // Check finger cursor position collisions with choice buttons and start button
  // All 4 hover states are batched into a single setHoverState call → single React re-render per cursor frame
  useEffect(() => {
    if (feedback !== null) {
      if (cursorRef.current) cursorRef.current.style.opacity = '0'
      setHoverState({ choiceIndex: null, start: false, playAgain: false, goHome: false })
      lastCoordsRef.current = null
      return
    }

    if (cursor.hands.length === 0) {
      if (cursorRef.current) cursorRef.current.style.opacity = '0'
      setHoverState({ choiceIndex: null, start: false, playAgain: false, goHome: false })
      lastCoordsRef.current = null
      return
    }

    if (!containerRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    
    // Smooth first hand for the old single cursor ref backward compatibility
    const firstHand = cursor.hands[0]
    if (firstHand) {
      const clientX = containerRect.left + (firstHand.x / 100) * containerRect.width
      const clientY = containerRect.top + (firstHand.y / 100) * containerRect.height

      targetCoordsRef.current = { x: clientX, y: clientY }
      
      // Snap visual coords to target on first frame of tracking
      if (!lastCoordsRef.current) {
        visualCoordsRef.current = { x: clientX, y: clientY }
        lastCoordsRef.current = { x: clientX, y: clientY }
      }

      if (cursorRef.current) cursorRef.current.style.opacity = '1'
    }

    let activeHoverIdx: number | null = null
    let activeHoverStart = false
    let activeHoverPlayAgain = false
    let activeHoverGoHome = false

    cursor.hands.forEach(hand => {
      const clientX = containerRect.left + (hand.x / 100) * containerRect.width
      const clientY = containerRect.top + (hand.y / 100) * containerRect.height

      // Find HTML element directly under the coordinates
      const element = document.elementFromPoint(clientX, clientY)
      if (element) {
        const choiceButton = element.closest('[data-choice-idx]')
        if (choiceButton) {
          const choiceIdx = parseInt(choiceButton.getAttribute('data-choice-idx') || '', 10)
          if (!isNaN(choiceIdx)) {
            activeHoverIdx = choiceIdx
          }
        }

        if (element.closest('[data-start-btn]')) activeHoverStart = true
        if (element.closest('[data-play-again-btn]')) activeHoverPlayAgain = true
        if (element.closest('[data-go-home-btn]')) activeHoverGoHome = true
      }
    })

    // Single batched update — React 18 automatic batching fires exactly 1 re-render for all 4 values
    setHoverState({
      choiceIndex: activeHoverIdx,
      start: activeHoverStart,
      playAgain: activeHoverPlayAgain,
      goHome: activeHoverGoHome
    })
  }, [cursor, feedback])

  const handleSelectAnswerRef = useRef<((choiceIdx: number) => void) | null>(null)
  // timeLeftRef: tracks actual countdown value via ref (not state) to avoid React 18 concurrent mode issues
  const timeLeftRef = useRef<number>(timeLimit)
  // questionAnsweredRef: ensures timeout fires at most ONCE per question regardless of React render timing
  const questionAnsweredRef = useRef<boolean>(false)
  // soundEnabledRef: allows timer to read current sound setting without needing it in dependencies
  const soundEnabledRef = useRef<boolean>(soundEnabled)
  useEffect(() => { soundEnabledRef.current = soundEnabled }, [soundEnabled])
  useEffect(() => {
    handleSelectAnswerRef.current = handleSelectAnswer
  })

  const handleStartGameRef = useRef<(() => void) | null>(null)
  useEffect(() => {
    handleStartGameRef.current = handleStartGame
  })

  // Selection progress logic (guarded by gameState === 'playing')
  useEffect(() => {
    if (gameState !== 'playing' || feedback !== null) {
      setHoverProgress(0)
      return
    }

    if (hoveredChoiceIndex === null) {
      setHoverProgress(0)
      return
    }

    const duration = 1500 // 1.5 seconds hover target
    const intervalTime = 50
    const step = (intervalTime / duration) * 105 // adjust to match exact scale

    const interval = setInterval(() => {
      setHoverProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          if (handleSelectAnswerRef.current) {
            handleSelectAnswerRef.current(hoveredChoiceIndex)
          }
          return 100
        }
        return prev + step
      })
    }, intervalTime)

    return () => clearInterval(interval)
  }, [hoveredChoiceIndex, gameState, feedback])

  // Start game hover selection progress logic (guarded by gameState === 'ready')
  useEffect(() => {
    if (gameState !== 'ready') {
      setStartHoverProgress(0)
      return
    }

    if (!hoveredStart) {
      setStartHoverProgress(0)
      return
    }

    const duration = 1500 // 1.5 seconds hover target
    const intervalTime = 50
    const step = (intervalTime / duration) * 105

    const interval = setInterval(() => {
      setStartHoverProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          if (handleStartGameRef.current) {
            handleStartGameRef.current()
          }
          return 100
        }
        return prev + step
      })
    }, intervalTime)

    return () => clearInterval(interval)
  }, [hoveredStart, gameState])

  // Play Again hover selection logic
  useEffect(() => {
    if (!hoveredPlayAgain) {
      setPlayAgainHoverProgress(0)
      return
    }
    const duration = 1500 // 1.5 seconds hover target
    const intervalTime = 50
    const step = (intervalTime / duration) * 105

    const interval = setInterval(() => {
      setPlayAgainHoverProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          const btn = document.querySelector('[data-play-again-btn]') as HTMLButtonElement | null
          if (btn) btn.click()
          return 100
        }
        return prev + step
      })
    }, intervalTime)

    return () => clearInterval(interval)
  }, [hoveredPlayAgain])

  // Go Home hover selection logic
  useEffect(() => {
    if (!hoveredGoHome) {
      setGoHomeHoverProgress(0)
      return
    }
    const duration = 1500 // 1.5 seconds hover target
    const intervalTime = 50
    const step = (intervalTime / duration) * 105

    const interval = setInterval(() => {
      setGoHomeHoverProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          const btn = document.querySelector('[data-go-home-btn]') as HTMLButtonElement | null
          if (btn) btn.click()
          return 100
        }
        return prev + step
      })
    }, intervalTime)

    return () => clearInterval(interval)
  }, [hoveredGoHome])

  // Update Play Again hover progress bar and data-hovered attribute directly in the DOM
  useEffect(() => {
    const progressBars = document.querySelectorAll('[data-play-again-progress]')
    progressBars.forEach(bar => {
      (bar as HTMLElement).style.width = `${playAgainHoverProgress}%`
    })
    const btns = document.querySelectorAll('[data-play-again-btn]')
    btns.forEach(btn => {
      if (hoveredPlayAgain) {
        btn.setAttribute('data-hovered', 'true')
      } else {
        btn.removeAttribute('data-hovered')
      }
    })
  }, [playAgainHoverProgress, hoveredPlayAgain])

  // Update Go Home hover progress bar and data-hovered attribute directly in the DOM
  useEffect(() => {
    const progressBars = document.querySelectorAll('[data-go-home-progress]')
    progressBars.forEach(bar => {
      (bar as HTMLElement).style.width = `${goHomeHoverProgress}%`
    })
    const btns = document.querySelectorAll('[data-go-home-btn]')
    btns.forEach(btn => {
      if (hoveredGoHome) {
        btn.setAttribute('data-hovered', 'true')
      } else {
        btn.removeAttribute('data-hovered')
      }
    })
  }, [goHomeHoverProgress, hoveredGoHome])

  // Fullscreen state management & event listeners
  const handleToggleFullscreen = async () => {
    if (!gameConsoleRef.current) return
    try {
      if (!document.fullscreenElement) {
        await gameConsoleRef.current.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err)
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  // Countdown & Start Game sequence
  const handleStartGame = () => {
    setGameState('countdown')
    setCountdownNumber(3)
    playTickSound(soundEnabled)

    let count = 3
    countdownIntervalRef.current = setInterval(() => {
      count -= 1
      if (count > 0) {
        setCountdownNumber(count)
        playTickSound(soundEnabled)
      } else if (count === 0) {
        setCountdownNumber(0) // represents "เริ่ม!"
        playTickSound(soundEnabled)
      } else {
        clearInterval(countdownIntervalRef.current)
        setGameState('playing')
        setQuestionStartTime(Date.now())
      }
    }, 1000)
  }

  // Clean up countdown interval on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }
  }, [])

  // 60 FPS loop to smoothly interpolate (Lerp) the cursor position and update the DOM directly
  useEffect(() => {
    let animId: number
    
    const updateCursorAnimation = () => {
      const target = targetCoordsRef.current
      const visual = visualCoordsRef.current
      
      const alpha = 0.22 // Smoothness factor
      visual.x = visual.x + alpha * (target.x - visual.x)
      visual.y = visual.y + alpha * (target.y - visual.y)
      
      // Update DOM styles using GPU translate3d (avoids React re-renders)
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${visual.x}px, ${visual.y}px, 0)`
      }
      
      lastCoordsRef.current = { x: visual.x, y: visual.y }
      
      animId = requestAnimationFrame(updateCursorAnimation)
    }
    
    animId = requestAnimationFrame(updateCursorAnimation)
    
    return () => {
      cancelAnimationFrame(animId)
    }
  }, [])

  useEffect(() => {
    if (!isActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      return
    }
    let active = true

    async function setupWebcam() {
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
            console.error('Autoplay error:', err)
          })
        }
        setWebcamStatus('active')
      } catch (err) {
        console.error('Error accessing webcam:', err)
        if (active) {
          if (err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
            setWebcamStatus('denied')
          } else {
            setWebcamStatus('error')
          }
        }
      }
    }

    setupWebcam()

    return () => {
      active = false
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }
  }, [isActive])

  // Reset everything when question changes
  useEffect(() => {
    questionAnsweredRef.current = false   // allow timeout to fire on new question
    timeLeftRef.current = timeLimit
    setQuestionStartTime(Date.now())
    setFeedback(null)
    setHoverState(prev => ({ ...prev, choiceIndex: null }))
    setTimeLeft(timeLimit)
  }, [currentIdx, timeLimit])

  // Timer — depends on currentIdx, gameState, isResultScreen, and timeLimit
  // Using questionAnsweredRef prevents double-fire without needing feedback in deps
  useEffect(() => {
    if (gameState !== 'playing') return
    if (isResultScreen) return  // Guard: stop timer immediately when result screen shows

    questionAnsweredRef.current = false
    timeLeftRef.current = timeLimit
    setTimeLeft(timeLimit)

    const timer = setInterval(() => {
      // Guard: if question already answered (by click or previous timeout), do nothing
      if (questionAnsweredRef.current) return
      if (isResultScreen) {
        clearInterval(timer)
        return
      }

      const prev = timeLeftRef.current
      const next = parseFloat((prev - 0.1).toFixed(1))

      if (next <= 0) {
        // Atomically mark as answered before any async work
        questionAnsweredRef.current = true
        clearInterval(timer)
        timeLeftRef.current = 0
        setTimeLeft(0)
        handleSelectAnswerRef.current?.(-1)
        return
      }

      timeLeftRef.current = next
      setTimeLeft(next)

      // Warning beep on whole-second boundaries in last 5 seconds
      if (next <= 5.0 && Math.floor(next) !== Math.floor(prev)) {
        playTickSound(soundEnabledRef.current)
      }
    }, 100)

    return () => clearInterval(timer)
  }, [currentIdx, gameState, isResultScreen, timeLimit])  // isResultScreen stops the timer immediately on game end

  const handleSelectAnswer = (choiceIdx: number) => {
    if (feedback !== null) return         // already showing feedback
    if (!activeQuestion) return           // safety
    if (questionAnsweredRef.current) return  // timer already fired — prevent double-call
    questionAnsweredRef.current = true    // lock immediately to block any concurrent calls

    const now = Date.now()
    const elapsedSeconds = choiceIdx === -1 ? timeLimit : (now - questionStartTime) / 1000
    let isCorrect = false
    if (choiceIdx !== -1) {
      if (activeQuestion.correctHash !== undefined && activeQuestion.salt !== undefined) {
        const hash = djb2Hash(activeQuestion.choices[choiceIdx] + activeQuestion.salt)
        isCorrect = (hash === activeQuestion.correctHash)
      } else {
        isCorrect = (choiceIdx === activeQuestion.answerIndex)
      }
    }

    // Calculate score logic
    let pointsEarned = 0
    let newCombo = combo
    let isSpeedBonus = false

    if (isCorrect) {
      pointsEarned += 10 // Correct Answer base points
      newCombo += 1      // Increment combo

      // Speed bonus (answering in under 5 seconds)
      if (elapsedSeconds <= 5.0) {
        pointsEarned += 5
        isSpeedBonus = true
      }

      // Combo bonus (Combo x2 gives +2, x3 gives +4 etc.)
      if (newCombo >= 2) {
        const comboBonusPoints = (newCombo - 1) * 2
        pointsEarned += comboBonusPoints
      }
    } else {
      newCombo = 0 // Reset combo on wrong answer
    }

    // Update States
    setScore(prev => prev + pointsEarned)
    setCombo(newCombo)
    if (newCombo > maxCombo) setMaxCombo(newCombo)

    // Visual triggers
    setFeedback({
      type: isCorrect ? 'correct' : 'incorrect',
      index: choiceIdx
    })
    
    if (isCorrect) {
      setScorePop(`+${pointsEarned}`)
      if (newCombo >= 2) setComboPop(true)
      if (isSpeedBonus) setSpeedPop(true)
    } else {
      if (choiceIdx === -1) {
        setScorePop('หมดเวลา! ⏰')
      }
    }

    // Play retro synth cues
    if (isCorrect) {
      playCorrectSound(soundEnabled)
    } else {
      playWrongSound(soundEnabled)
    }

    // Determine correct answer text securely
    let correctAnswerText = ''
    if (activeQuestion.correctHash !== undefined && activeQuestion.salt !== undefined) {
      const foundIdx = activeQuestion.choices.findIndex(choice => 
        djb2Hash(choice + activeQuestion.salt) === activeQuestion.correctHash
      )
      if (foundIdx !== -1) {
        correctAnswerText = activeQuestion.choices[foundIdx]
      }
    } else if (activeQuestion.answerIndex !== undefined) {
      correctAnswerText = activeQuestion.choices[activeQuestion.answerIndex]
    }

    // Record answer history
    const record: AnswerRecord = {
      questionId: activeQuestion.id,
      equation: activeQuestion.equation,
      isCorrect,
      selectedAnswer: choiceIdx === -1 ? 'หมดเวลา (Timeout)' : activeQuestion.choices[choiceIdx],
      correctAnswer: correctAnswerText,
      timeTaken: parseFloat(elapsedSeconds.toFixed(1))
    }
    const updatedRecords = [...records, record]
    setRecords(updatedRecords)

    // Advance to next question or end match
    setTimeout(() => {
      // Clear visual pops
      setScorePop(null)
      setComboPop(false)
      setSpeedPop(false)

      if (currentIdx + 1 < questions.length) {
        setCurrentIdx(prev => prev + 1)
      } else {
        // Calculate total score including perfect round bonus (+20 if all 5 are correct)
        const allCorrect = updatedRecords.filter(r => r.isCorrect).length === questions.length
        let finalScore = score + pointsEarned
        if (allCorrect) {
          finalScore += 20
        }
        onGameFinished(updatedRecords, finalScore, Math.max(newCombo, maxCombo))
      }
    }, 1500) // Delay to show correctness feedback
  }

  const getChoiceLabel = (index: number) => {
    return ['A', 'B', 'C', 'D'][index]
  }

  const getChoiceColorClass = (index: number) => {
    if (!activeQuestion) return ''
    if (feedback !== null) {
      if (index === activeQuestion.answerIndex) {
        return 'border-success bg-success/20 text-white' // Always show correct answer in green
      }
      if (feedback.index === index && feedback.type === 'incorrect') {
        return 'border-danger bg-danger/20 text-white' // Show user's incorrect choice in red
      }
      return 'border-slate-800/40 bg-slate-900/20 text-slate-500 opacity-60'
    }

    // Active hovered lock-on style
    if (hoveredChoiceIndex === index) {
      return 'border-secondary bg-secondary/10 text-white ring-2 ring-secondary/40 ring-offset-2 ring-offset-slate-950 scale-105 shadow-lg shadow-secondary/20'
    }

    return 'border-slate-700/50 bg-slate-800/60 text-slate-200 hover:border-slate-650 hover:bg-slate-750'
  }

  if (!activeQuestion) {
    return null
  }

  return (
    <div 
      ref={gameConsoleRef} 
      className={`w-full flex flex-col items-center justify-center relative transition-all duration-300 ${
        isFullscreen 
          ? 'w-screen h-screen max-w-none bg-slate-950 p-0 gap-0 justify-start' 
          : isResultScreen
            ? 'absolute inset-0 w-full h-full z-0 bg-transparent border-none p-0'
            : 'max-w-6xl mx-auto gap-3 sm:gap-5 p-4 bg-slate-950/20 rounded-3xl border border-slate-900/10 backdrop-blur-sm'
      }`}
    >
      
      {/* Visual Feedback Alerts Overlay */}
      <div className="absolute top-1/4 flex flex-col items-center gap-3 z-30 pointer-events-none w-full">
        {scorePop && (
          <div className="animate-bounce font-display font-black text-5xl text-warning drop-shadow-[0_4px_12px_rgba(245,158,11,0.5)]">
            {scorePop}
          </div>
        )}
        
        {comboPop && (
          <div className="animate-ping [animation-duration:1.5s] bg-accent/90 text-white px-6 py-2 rounded-full font-display font-black text-xl tracking-wider shadow-lg shadow-accent/40 uppercase">
            Combo x{combo}! 🔥
          </div>
        )}

        {speedPop && (
          <div className="animate-pulse bg-secondary/90 text-white px-5 py-1.5 rounded-full font-display font-black text-sm tracking-wider shadow-lg shadow-secondary/40 uppercase flex items-center gap-1.5">
            <Zap className="w-4 h-4 fill-white" />
            Speed Bonus! ⚡
          </div>
        )}
      </div>

      {/* Top HUD */}
      {!isResultScreen && (
        <div 
          className={`w-full flex justify-between items-center gap-2 sm:gap-4 z-20 transition-all duration-300 ${
            isFullscreen 
              ? 'absolute top-6 left-0 right-0 px-8 pointer-events-none [&>*]:pointer-events-auto' 
              : ''
          }`}
        >
          {/* Score & Combo */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <div className="glass-panel px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl flex items-center gap-1.5 sm:gap-2.5 border-slate-700/50">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-warning shrink-0" />
              <div>
                <span className="text-[8px] sm:text-[10px] text-slate-400 font-bold block uppercase leading-none mb-0.5">คะแนนสะสม</span>
                <span className="font-display font-black text-sm sm:text-xl text-white tracking-tight leading-none">{score}</span>
              </div>
            </div>

            {combo >= 2 && (
              <div className="bg-gradient-to-r from-accent to-purple-600 px-2 py-1.5 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl flex items-center gap-1 sm:gap-1.5 shadow-lg shadow-accent/20 animate-pulse shrink-0">
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white text-white shrink-0" />
                <span className="font-display font-black text-[10px] sm:text-sm text-white">X{combo}</span>
              </div>
            )}
          </div>

          {/* Question Dot Timeline — records reset per game via key={gameKey} so simple index lookup is safe */}
          <div className="flex items-center gap-1 sm:gap-2 bg-slate-900/60 px-2 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl border border-slate-800/40">
            {questions.map((_, i) => {
              const isAnswered = i < currentIdx   // all previous questions are answered
              const isActive = i === currentIdx   // current question being played
              const record = records[i]           // safe: records always fresh per game (key={gameKey})

              let colorClass = 'bg-slate-800 border-slate-700/50'
              if (isAnswered && record) {
                // Show green or red based on actual answer result
                colorClass = record.isCorrect
                  ? 'bg-success border-success shadow-md shadow-success/20'
                  : 'bg-danger border-danger shadow-md shadow-danger/20'
              } else if (isAnswered && !record) {
                // Record not yet in state (render timing) — show neutral pending
                colorClass = 'bg-slate-500 border-slate-400'
              } else if (isActive) {
                colorClass = 'bg-secondary/20 border-secondary animate-pulse scale-110'
              }

              return (
                <div
                  key={i}
                  className={`w-2 h-2 sm:w-3.5 sm:h-3.5 rounded-full border transition-all duration-300 ${colorClass}`}
                />
              )
            })}
          </div>

          {/* Fullscreen & Question Tracker */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleToggleFullscreen}
              className="glass-panel-interactive p-2 px-2.5 sm:px-3 rounded-xl sm:rounded-2xl border-slate-700/50 text-slate-350 hover:text-white flex items-center justify-center transition-all cursor-pointer select-none text-xs sm:text-sm font-bold gap-1.5"
              title={isFullscreen ? "ออกจากเต็มหน้าจอ" : "เต็มหน้าจอ"}
            >
              <span>{isFullscreen ? "🗕" : "🖥️"}</span>
              <span className="hidden md:inline">{isFullscreen ? "ย่อหน้าจอ" : "เต็มหน้าจอ"}</span>
            </button>

            <div className="glass-panel px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl flex items-center gap-1.5 sm:gap-2 border-slate-700/50">
              <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5 text-secondary shrink-0" />
              <div>
                <span className="text-[8px] sm:text-[10px] text-slate-400 font-bold block uppercase leading-none mb-0.5">ความคืบหน้า</span>
                <span className="font-display font-black text-xs sm:text-sm text-white tracking-wider leading-none">
                  <span className="hidden sm:inline">โจทย์ข้อ </span>{currentIdx + 1}/{questions.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Central Screen Area (Combined Question Board + Live Feed Background Container) */}
      <div 
        ref={containerRef} 
        className={`relative overflow-hidden shadow-inner flex flex-col justify-center items-center bg-slate-950 transition-all duration-300 ${
          isFullscreen 
            ? 'w-screen h-screen max-w-none max-h-none rounded-none border-none my-0' 
            : isResultScreen
              ? 'absolute inset-0 w-full h-full rounded-none border-none my-0'
              : 'my-2 w-full max-w-6xl aspect-[3/4] sm:aspect-[4/3] md:aspect-[16/9] max-h-[64svh] rounded-3xl border border-slate-800'
        }`}
      >
        
        {/* Countdown progress bar */}
        {gameState === 'playing' && (
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-900 z-20">
            <div 
              className={`h-full transition-all duration-100 ${
                timeLeft > 5 ? 'bg-secondary animate-pulse' : 'bg-danger animate-pulse'
              }`}
              style={{ width: `${(timeLeft / timeLimit) * 100}%` }}
            />
          </div>
        )}

        {/* Real Mirrored Video Stream */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-300 pointer-events-none`}
          style={{
            transform: `rotate(${cameraRotation}deg) ${mirrorHorizontal ? 'scaleX(-1)' : 'scaleX(1)'}`,
            opacity: webcamStatus === 'active' ? (isResultScreen ? 0.25 : virtualCameraOutput ? 1 : 0.92) : 0
          }}
        />

        {/* Video Overlays (Dark tint, Scanlines, Glows) */}
        <div className={`absolute inset-0 z-0 pointer-events-none ${isResultScreen ? 'bg-slate-950/85' : 'bg-gradient-to-b from-slate-900/30 to-slate-950/70'}`} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0)_95%,rgba(18,24,38,0.2)_5%)] bg-[size:100%_40px] pointer-events-none z-0" />

        {/* Ready State Overlay */}
        {gameState === 'ready' && !isResultScreen && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-30 bg-slate-950/75 backdrop-blur-md animate-[fade-in_0.3s_ease-out]">
            <div className="glass-panel max-w-md p-6 sm:p-8 rounded-3xl border-slate-750 shadow-2xl flex flex-col items-center gap-5 sm:gap-6">
              <div className="w-14 h-14 rounded-2xl bg-secondary/15 flex items-center justify-center border border-secondary/30">
                <Video className="w-7 h-7 text-secondary animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="font-display font-extrabold text-xl sm:text-2xl text-white">
                  เตรียมความพร้อมก่อนเริ่มเกม
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed px-2">
                  กรุณายืนจัดตำแหน่งกล้องและร่างกายให้เรียบร้อย และตรวจเช็คการวางมือในเฟรมกล้อง
                </p>
                {webcamStatus === 'active' && (
                  <p className="text-[11px] text-secondary font-bold animate-pulse mt-1">
                    💡 ชี้ค้างไว้ที่ปุ่มเริ่มเกม (1.5 วินาที) เพื่อเริ่มเล่นทันทีด้วยมือของคุณ!
                  </p>
                )}
              </div>
              
              <button
                data-start-btn="true"
                onMouseEnter={() => setHoverState(prev => ({ ...prev, start: true }))}
                onMouseLeave={() => setHoverState(prev => ({ ...prev, start: false }))}
                onClick={handleStartGame}
                className={`w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-gradient-to-r from-secondary to-primary hover:from-secondary/90 hover:to-primary/90 text-white font-display font-black text-sm sm:text-base tracking-wider shadow-lg shadow-secondary/20 hover:shadow-secondary/35 active:scale-[0.98] transition-all cursor-pointer touch-target flex items-center justify-center gap-2 relative overflow-hidden ${
                  hoveredStart ? 'ring-2 ring-secondary/50 scale-105 shadow-xl shadow-secondary/20' : ''
                }`}
              >
                <span>เริ่มเล่นเกม</span>
                {/* Hover progress bar */}
                {hoveredStart && (
                  <div 
                    className="absolute bottom-0 left-0 h-1.5 bg-gradient-to-r from-secondary to-accent transition-all duration-75"
                    style={{ width: `${startHoverProgress}%` }}
                  />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Countdown Overlay */}
        {gameState === 'countdown' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-30 bg-slate-950/60 backdrop-blur-sm">
            <div className="w-56 h-56 flex items-center justify-center">
              <span 
                key={countdownNumber}
                className="font-display font-black text-8xl sm:text-10xl text-secondary drop-shadow-[0_0_35px_rgba(6,182,212,0.7)] animate-bounce select-none"
              >
                {countdownNumber === 0 ? "เริ่ม! 🎮" : countdownNumber}
              </span>
            </div>
          </div>
        )}
        {/* Result Screen Overlay */}
        {isResultScreen && resultScreenProps && (
          <div className="absolute inset-0 z-30 overflow-y-auto bg-transparent flex items-center justify-center p-4 pointer-events-auto">
            <ResultScreen {...resultScreenProps} />
          </div>
        )}

        {cursor.hands.map((hand, handIdx) => {
          if (!hand.landmarks) return null
          return (
            <svg key={handIdx} className="absolute inset-0 w-full h-full z-40 pointer-events-none">
              {[
                [0,1],[1,2],[2,3],[3,4],
                [0,5],[5,6],[6,7],[7,8],
                [5,9],[9,10],[10,11],[11,12],
                [9,13],[13,14],[14,15],[15,16],
                [13,17],[17,18],[18,19],[19,20],
                [0,17]
              ].map(([a, b]) => {
                const p1 = hand.landmarks![a]
                const p2 = hand.landmarks![b]
                return (
                  <line
                    key={`${a}-${b}`}
                    x1={`${p1.x}%`}
                    y1={`${p1.y}%`}
                    x2={`${p2.x}%`}
                    y2={`${p2.y}%`}
                    stroke={hand.label === 'Left' ? 'rgba(45, 212, 191, 0.85)' : 'rgba(139, 92, 246, 0.85)'}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                )
              })}
              {hand.landmarks.map((point, idx) => (
                <circle
                  key={idx}
                  cx={`${point.x}%`}
                  cy={`${point.y}%`}
                  r={idx === 8 ? 6 : 2.5}
                  fill={idx === 8 ? '#ffffff' : hand.label === 'Left' ? 'rgba(45, 212, 191, 0.9)' : 'rgba(139, 92, 246, 0.9)'}
                  stroke={idx === 8 ? (hand.label === 'Left' ? '#2dd4bf' : '#8b5cf6') : 'rgba(15, 23, 42, 0.7)'}
                  strokeWidth={idx === 8 ? 2 : 1}
                />
              ))}
            </svg>
          )
        })}

        {/* Fallback States (Loading / Denied / Error) */}
        {webcamStatus !== 'active' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-0 bg-slate-900">
            {webcamStatus === 'loading' && (
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-semibold tracking-wider uppercase">กำลังเปิดกล้อง Webcam...</span>
              </div>
            )}
            
            {webcamStatus === 'denied' && (
              <div className="flex flex-col items-center gap-2 text-warning max-w-xs">
                <Video className="w-12 h-12 text-warning animate-pulse" />
                <span className="text-sm font-bold uppercase">ไม่ได้รับอนุญาตให้ใช้กล้อง</span>
                <p className="text-[11px] text-slate-400 leading-normal">
                  กรุณาอนุญาตสิทธิ์การเข้าใช้งานกล้องบน Browser ของท่านเพื่อสัมผัสประสบการณ์การเล่นเกมด้วยท่าทางเต็มรูปแบบ
                </p>
              </div>
            )}

            {webcamStatus === 'error' && (
              <div className="flex flex-col items-center gap-2 text-danger max-w-xs">
                <Video className="w-12 h-12 text-danger animate-pulse" />
                <span className="text-sm font-bold uppercase">ไม่พบอุปกรณ์กล้อง</span>
                <p className="text-[11px] text-slate-400 leading-normal">
                  ไม่สามารถเข้าถึงกล้อง Webcam ได้ กรุณาเชื่อมต่ออุปกรณ์กล้องแล้วเล่นอีกครั้ง
                </p>
              </div>
            )}
          </div>
        )}



        {/* Question Panel (Glow overlay at bottom) */}
        {gameState === 'playing' && !isResultScreen && (
          <div
            className={`absolute left-1/2 -translate-x-1/2 z-20 w-[80%] sm:w-[55%] md:w-[45%] max-w-xl transition-all duration-300 ${
              isFullscreen ? 'bottom-8 sm:bottom-12' : 'bottom-3 sm:bottom-4'
            }`}
          >
            <div
              key={currentIdx}
              className={`w-full px-4 sm:px-5 py-2.5 sm:py-3.5 glass-panel rounded-2xl border-slate-700/40 shadow-2xl flex flex-col items-center animate-question-card question-card-glow ${
                hoveredChoiceIndex !== null ? 'ring-2 ring-secondary/70 ring-offset-2 ring-offset-slate-950 scale-[1.01]' : ''
              }`}
            >
              <span className="text-[10px] font-bold text-secondary tracking-widest uppercase mb-2">
                {activeQuestion.category.toUpperCase()} SOLVER
              </span>

              {hasEqualsSign ? (
                <div className="flex items-center justify-center gap-4 mb-2">
                  <span className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                    {equationText} =
                  </span>
                  
                  {/* Dotted target box */}
                  <div 
                    className={`min-w-[6rem] sm:min-w-[7rem] w-auto h-24 sm:h-28 px-4 sm:px-6 rounded-2xl border-4 border-dashed transition-all flex flex-col items-center justify-center relative overflow-hidden ${
                      hoveredChoiceIndex !== null && feedback === null
                        ? 'border-secondary/80 bg-secondary/15 scale-105 animate-pulse' 
                        : 'border-slate-600 bg-slate-900/40'
                    }`}
                  >
                    {feedback !== null ? (
                      <span className="font-display font-extrabold text-2xl sm:text-3xl text-white whitespace-nowrap">
                        {feedback.index === -1 ? '⏰' : activeQuestion.choices[feedback.index]}
                      </span>
                    ) : hoveredChoiceIndex !== null ? (
                      <div className="flex flex-col items-center justify-center w-full px-1">
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mb-1 whitespace-nowrap">กำลังเลือก...</span>
                        <span className="font-display font-black text-xl sm:text-2xl text-secondary animate-pulse whitespace-nowrap">
                          {activeQuestion.choices[hoveredChoiceIndex]}
                        </span>
                      </div>
                    ) : (
                      <span className="font-display font-black text-4xl text-slate-600">?</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 mb-2 w-full">
                  <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white text-center leading-normal drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] max-w-2xl px-4">
                    {equationText}
                  </h2>
                  
                  <div className="flex items-center gap-3 justify-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">คำตอบ = </span>
                    {/* Dotted target box */}
                    <div 
                      className={`min-w-[6rem] sm:min-w-[7rem] w-auto h-24 sm:h-28 px-4 sm:px-6 rounded-2xl border-4 border-dashed transition-all flex flex-col items-center justify-center relative overflow-hidden ${
                        hoveredChoiceIndex !== null && feedback === null
                          ? 'border-secondary/80 bg-secondary/15 scale-105 animate-pulse' 
                          : 'border-slate-650 bg-slate-900/40'
                      }`}
                    >
                      {feedback !== null ? (
                        <span className="font-display font-extrabold text-2xl sm:text-3xl text-white whitespace-nowrap">
                          {feedback.index === -1 ? '⏰' : activeQuestion.choices[feedback.index]}
                        </span>
                      ) : hoveredChoiceIndex !== null ? (
                        <div className="flex flex-col items-center justify-center w-full px-1">
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mb-1 whitespace-nowrap">กำลังเลือก...</span>
                          <span className="font-display font-black text-xl sm:text-2xl text-secondary animate-pulse whitespace-nowrap">
                            {activeQuestion.choices[hoveredChoiceIndex]}
                          </span>
                        </div>
                      ) : (
                        <span className="font-display font-black text-4xl text-slate-600">?</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium tracking-wide text-center max-w-xs sm:max-w-md mt-1.5">
                ชี้ค้างไว้ที่กล่องคำตอบ (1.5 วินาที) เพื่อส่งคำตอบ
              </p>
            </div>
          </div>
        )}

        {/* Bottom-right corner timer widget */}
        {gameState === 'playing' && !isResultScreen && (
          <div className={`absolute z-25 flex items-center gap-2 sm:gap-3 glass-panel px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-2xl border-slate-700/50 transition-all duration-300 pointer-events-none select-none ${
            isFullscreen 
              ? 'bottom-64 right-4 sm:bottom-8 sm:right-8' 
              : 'bottom-60 right-4 sm:bottom-4 sm:right-6'
          }`}>
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
              {/* Circular Progress Ring */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 40 40">
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  className="stroke-slate-800/40"
                  strokeWidth="3.5"
                  fill="transparent"
                />
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  className={`transition-all duration-100 ${
                    timeLeft > 5 ? 'stroke-secondary' : 'stroke-danger'
                  }`}
                  strokeWidth="3.5"
                  fill="transparent"
                  strokeDasharray="100.5"
                  strokeDashoffset={100.5 * (1 - timeLeft / timeLimit)}
                  strokeLinecap="round"
                />
              </svg>
              <ClockIcon className={`absolute w-3.5 h-3.5 sm:w-4 sm:h-4 ${timeLeft > 5 ? 'text-secondary' : 'text-danger animate-pulse'}`} />
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-0.5">เวลาที่เหลือ</span>
              <span className={`font-display font-black text-sm sm:text-base tracking-tight leading-none ${
                timeLeft > 5 ? 'text-white' : 'text-danger animate-pulse'
              }`}>
                {timeLeft.toFixed(1)} <span className="text-[10px] font-bold text-slate-400">วิ</span>
              </span>
            </div>
          </div>
        )}

        {/* Answer cards sit on top of the camera feed so they can be grabbed in-frame. */}
        {gameState === 'playing' && !isResultScreen && (
          <div 
            className={`choices-container absolute left-1/2 -translate-x-1/2 w-[94%] z-30 transition-all duration-300 ${
              isFullscreen ? 'top-28 sm:top-32' : 'top-6'
            }`}
          >
            <div 
              key={`choices-${currentIdx}`}
              className="w-full animate-choices-entry"
            >
            <div className="grid grid-cols-4 gap-3 sm:gap-4">
              {activeQuestion.choices.map((choice, idx) => (
                <button
                  key={idx}
                  data-choice-idx={idx}
                  disabled={feedback !== null}
                  onMouseEnter={() => feedback === null && setHoverState(prev => ({ ...prev, choiceIndex: idx }))}
                  onMouseLeave={() => feedback === null && hoveredChoiceIndex === idx && setHoverState(prev => ({ ...prev, choiceIndex: null }))}
                  onClick={() => feedback === null && handleSelectAnswer(idx)}
                  className={`relative h-20 sm:h-32 px-2 sm:px-4 border rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 select-none shadow-md overflow-hidden backdrop-blur-md bg-slate-900/80 ${getChoiceColorClass(idx)}`}
                >
                  <span className="absolute top-1 left-1.5 sm:top-2.5 sm:left-3 text-[8px] sm:text-[10px] font-black text-slate-400 uppercase bg-slate-900/50 px-1 py-0.5 sm:px-1.5 sm:py-0.5 rounded border border-slate-700/20">
                    {getChoiceLabel(idx)}
                  </span>

                  {feedback !== null && idx === activeQuestion.answerIndex && (
                    <span className="absolute top-1 right-1.5 sm:top-2 sm:right-2 p-0.5 sm:p-1 rounded-full bg-success/20 text-success">
                      <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                    </span>
                  )}
                  {feedback !== null && feedback.index === idx && feedback.type === 'incorrect' && (
                    <span className="absolute top-1 right-1.5 sm:top-2 sm:right-2 p-0.5 sm:p-1 rounded-full bg-danger/20 text-danger">
                      <X className="w-3 h-3 sm:w-4 sm:h-4" />
                    </span>
                  )}

                  <span className="font-display font-extrabold text-base sm:text-2xl tracking-tight mt-1 sm:mt-1.5 break-words text-center px-1">
                    {choice}
                  </span>

                  {/* Hover progress bar */}
                  {hoveredChoiceIndex === idx && feedback === null && (
                    <div 
                      className="absolute bottom-0 left-0 h-1.5 bg-gradient-to-r from-secondary to-accent transition-all duration-75"
                      style={{ width: `${hoverProgress}%` }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      </div>



      {/* Glowing Hand Tracking Cursor */}
      <div 
        ref={cursorRef}
        className="fixed pointer-events-none z-50 left-0 top-0 flex flex-col items-center gap-2 transition-opacity duration-150 opacity-0"
        style={{
          willChange: 'transform'
        }}
      />
    </div>
  )
})
