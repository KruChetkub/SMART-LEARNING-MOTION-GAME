import React, { useEffect } from 'react'
import { Trophy, RefreshCw, Home, CheckCircle2, XCircle, Timer } from 'lucide-react'
import type { GameStats } from '../types/game'
import { playVictorySound } from '../lib/audio'

interface ResultScreenProps {
  stats: GameStats
  onPlayAgain: () => void
  onGoHome: () => void
  soundEnabled: boolean
  lastGameResult?: any | null
  profile?: any | null
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

export const ResultScreen: React.FC<ResultScreenProps> = ({
  stats,
  onPlayAgain,
  onGoHome,
  soundEnabled,
  lastGameResult = null,
  profile = null
}) => {
  useEffect(() => {
    // Play retro fanfare arpeggio chime
    playVictorySound(soundEnabled)

    // Trigger canvas confetti bursts
    if (window.confetti) {
      window.confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      })

      const timer1 = setTimeout(() => {
        window.confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 }
        })
      }, 250)

      const timer2 = setTimeout(() => {
        window.confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 }
        })
      }, 500)

      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
      }
    }
  }, [soundEnabled])
  // Determine badge styling and display details
  const getBadgeDetails = (badge: string) => {
    switch (badge.toUpperCase()) {
      case 'LEGEND':
        return { color: 'from-amber-400 via-pink-500 to-purple-600', text: '🏆 มหาตำนาน (Legend)', desc: 'สุดยอดฝีมือระดับตำนาน! เล่นได้อย่างยอดเยี่ยมและไร้ที่ติ' }
      case 'MASTER':
        return { color: 'from-violet-600 to-indigo-600', text: '💎 ปรมาจารย์ (Master)', desc: 'เก่งกาจสมชื่อปรมาจารย์ ทุกโจทย์ตอบได้ในพริบตา' }
      case 'DIAMOND':
        return { color: 'from-cyan-400 to-blue-500', text: '✨ เพชรแท้ (Diamond)', desc: 'ฝีมือเฉียบคมและแม่นยำสูงมาก ยอดเยี่ยม!' }
      case 'PLATINUM':
        return { color: 'from-slate-300 to-slate-500', text: '💿 แพลทินัม (Platinum)', desc: 'ความเร็วและความแม่นยำประสานงานกันได้สวยงาม' }
      case 'GOLD':
        return { color: 'from-yellow-400 to-amber-600', text: '🥇 ทองคำ (Gold)', desc: 'ผลลัพธ์ยอดเยี่ยม! ฝีมือของผู้เรียนระดับท็อป' }
      case 'SILVER':
        return { color: 'from-slate-400 to-slate-200', text: '🥈 เงิน (Silver)', desc: 'เก่งมากครับ พัฒนาต่อไปเพื่อคว้าอันดับทอง!' }
      default:
        return { color: 'from-amber-700 to-amber-900', text: '🥉 ทองแดง (Bronze)', desc: 'ทำได้ดีครับ หมั่นฝึกซ้อมอีกสักนิดเพื่อคะแนนที่สูงขึ้น' }
    }
  }

  const badgeConfig = getBadgeDetails(stats.earnedBadge)

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col justify-center items-center px-4 py-3 sm:py-6 md:py-8 min-h-[80svh]">
      
      {/* Celebration Header */}
      <div className="text-center mb-3 sm:mb-6 relative animate-fade-in">
        <div className="absolute inset-0 bg-success/20 rounded-full blur-3xl opacity-30 transform scale-110 -z-10" />
        <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-warning mx-auto mb-2 sm:mb-3 animate-pulse" />
        <h1 className="font-display font-black text-2xl sm:text-4xl text-white">
          จบเกมการแข่งขัน!
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1 font-medium">
          ผลลัพธ์ยอดเยี่ยมจากการเรียนรู้ผ่านการเคลื่อนไหว
        </p>
      </div>

      {/* 3-Column Responsive Grid Layout */}
      <div className="w-full grid grid-cols-1 md:grid-cols-[160px_1fr_160px] lg:grid-cols-[200px_1fr_200px] gap-4 md:gap-6 items-center z-20">
        
        {/* Left Column: Play Again Button (Desktop Only) */}
        <div className="hidden md:flex order-2 md:order-1 justify-center w-full">
          <button
            data-play-again-btn="true"
            onClick={onPlayAgain}
            className="relative overflow-hidden w-full max-w-xs md:h-64 py-4 md:py-0 rounded-2xl md:rounded-3xl bg-gradient-to-r md:bg-gradient-to-b from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-white font-display font-extrabold text-lg shadow-lg shadow-primary/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-row md:flex-col items-center justify-center gap-3 cursor-pointer select-none touch-target data-[hovered=true]:ring-2 data-[hovered=true]:ring-secondary/40 data-[hovered=true]:scale-105 data-[hovered=true]:ring-offset-2 data-[hovered=true]:ring-offset-slate-950"
          >
            <RefreshCw className="w-5 h-5 md:w-8 md:h-8 animate-spin-slow shrink-0" />
            <span className="text-center text-sm md:text-lg leading-tight">เล่นอีกครั้ง<br className="hidden md:inline" /> (Play Again)</span>
            <div
              data-play-again-progress="true"
              className="absolute bottom-0 left-0 h-1.5 md:h-2 bg-gradient-to-r from-secondary to-accent transition-all duration-75"
              style={{ width: '0%' }}
            />
          </button>
        </div>

        {/* Center Column: Scoreboard Card & Level Progress Card */}
        <div className="order-1 md:order-2 flex flex-col items-center w-full gap-3.5 sm:gap-6">
          {/* Main Score & Badge Card */}
          <div className="w-full glass-panel rounded-2xl md:rounded-3xl p-4 sm:p-6 border-slate-700/50 text-center">
            {/* Badge Presentation */}
            <div className="mb-4 sm:mb-6 flex flex-col items-center">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1 sm:mb-2">
                เกียรติยศระดับ (Badge Level)
              </span>
              <div className={`px-5 py-2.5 sm:px-6 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r ${badgeConfig.color} shadow-lg text-white font-display font-black text-lg sm:text-xl tracking-wider uppercase animate-bounce [animation-duration:4s]`}>
                {badgeConfig.text}
              </div>
              <p className="text-[10px] sm:text-xs text-slate-300 mt-2 sm:mt-3 max-w-xs leading-relaxed font-medium">
                {badgeConfig.desc}
              </p>
            </div>

            <div className="h-px bg-slate-800 my-3 sm:my-4" />

            {/* Score metrics */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 py-1 sm:py-2">
              <div className="bg-slate-900/60 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-800/40">
                <span className="text-[10px] sm:text-xs text-slate-400 font-bold block mb-1">คะแนนรวมทั้งหมด</span>
                <span className="font-display font-black text-2xl sm:text-4xl text-white block tracking-tight">
                  {stats.totalScore}
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mt-1">
                  POINTS
                </span>
              </div>

              <div className="bg-slate-900/60 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-800/40 flex flex-col justify-center">
                <span className="text-[10px] sm:text-xs text-slate-400 font-bold block mb-1">ความแม่นยำ</span>
                <span className="font-display font-black text-2xl sm:text-4xl text-secondary block tracking-tight">
                  {stats.accuracy}%
                </span>
                <div className="w-full bg-slate-850 h-1.5 rounded-full overflow-hidden mt-1.5 sm:mt-2">
                  <div 
                    className="bg-secondary h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${stats.accuracy}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Mobile-Only Action Buttons (Rendered in the middle on mobile) */}
            <div className="grid grid-cols-2 gap-3 my-2.5 w-full md:hidden">
              <button
                data-play-again-btn="true"
                onClick={onPlayAgain}
                className="relative overflow-hidden w-full py-2.5 rounded-xl bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-white font-display font-extrabold text-xs sm:text-sm shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none touch-target data-[hovered=true]:ring-2 data-[hovered=true]:ring-secondary/40 data-[hovered=true]:scale-105"
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin-slow shrink-0" />
                <span>เล่นอีกครั้ง (Play Again)</span>
                <div
                  data-play-again-progress="true"
                  className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-secondary to-accent transition-all duration-75"
                  style={{ width: '0%' }}
                />
              </button>
              <button
                data-go-home-btn="true"
                onClick={onGoHome}
                className="relative overflow-hidden w-full py-2.5 rounded-xl bg-slate-800 border border-slate-700/60 hover:bg-slate-750 text-slate-200 font-display font-extrabold text-xs sm:text-sm shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none touch-target data-[hovered=true]:ring-2 data-[hovered=true]:ring-secondary/40 data-[hovered=true]:scale-105"
              >
                <Home className="w-3.5 h-3.5 shrink-0" />
                <span>หน้าหลัก (Home)</span>
                <div
                  data-go-home-progress="true"
                  className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-secondary to-accent transition-all duration-75"
                  style={{ width: '0%' }}
                />
              </button>
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-3 sm:mt-4 text-left">
              <div className="bg-slate-900/40 px-2 sm:px-3 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl border border-slate-800/30 flex items-center gap-1.5 sm:gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success shrink-0" />
                <div>
                  <span className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase block leading-none mb-0.5 sm:mb-1">ถูกต้อง</span>
                  <span className="text-[10px] sm:text-xs text-slate-200 font-bold">{stats.correctCount} / {stats.correctCount + stats.wrongCount} ข้อ</span>
                </div>
              </div>
              <div className="bg-slate-900/40 px-2 sm:px-3 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl border border-slate-800/30 flex items-center gap-1.5 sm:gap-2">
                <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-danger shrink-0" />
                <div>
                  <span className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase block leading-none mb-0.5 sm:mb-1">ผิดพลาด</span>
                  <span className="text-[10px] sm:text-xs text-slate-200 font-bold">{stats.wrongCount} ข้อ</span>
                </div>
              </div>
              <div className="bg-slate-900/40 px-2 sm:px-3 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl border border-slate-800/30 flex items-center gap-1.5 sm:gap-2">
                <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent shrink-0" />
                <div>
                  <span className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase block leading-none mb-0.5 sm:mb-1">เวลาที่ใช้</span>
                  <span className="text-[10px] sm:text-xs text-slate-200 font-bold">{stats.timeUsed} วินาที</span>
                </div>
              </div>
            </div>
          </div>

          {/* EXP & Rank Progress Card */}
          {profile && lastGameResult && (
            <div className="w-full glass-panel rounded-2xl md:rounded-3xl p-3.5 sm:p-5 border-slate-700/50 relative overflow-hidden text-center">
              {/* Left vertical visual accent bar */}
              <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary via-blue-500 to-secondary" />
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
                {/* Left: EXP & Level progress */}
                <div className="flex-1 w-full text-left">
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      พลังงานการเรียนรู้ (EXP & Level)
                    </span>
                    <span className="text-[10px] sm:text-xs font-black text-amber-400 animate-pulse">
                      +{lastGameResult.earnedExp} EXP
                    </span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-white font-black text-xs sm:text-sm shadow-md shrink-0 select-none">
                      Lvl {profile.level}
                    </div>
                    <div className="flex-1">
                      <div className="h-1.5 sm:h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-1000"
                          style={{ 
                            width: `${Math.min(100, ((profile.exp - (getLevelFromExp(profile.exp).prevLevelExpThreshold)) / ((getLevelFromExp(profile.exp).nextLevelExpThreshold) - (getLevelFromExp(profile.exp).prevLevelExpThreshold))) * 100)}%`
                          }}
                        />
                      </div>
                      <span className="text-[8px] sm:text-[9px] text-slate-500 font-bold block mt-0.5 sm:mt-1">
                        {profile.exp} / {getLevelFromExp(profile.exp).nextLevelExpThreshold} EXP
                      </span>
                    </div>
                  </div>

                  {lastGameResult.levelUp && (
                    <div className="mt-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-2 py-1 flex items-center gap-1.5 justify-center text-amber-400 text-[8px] sm:text-[10px] font-black animate-bounce">
                      🎉 เลเวลอัป! คุณระดับสูงขึ้นแล้ว! 🎉
                    </div>
                  )}
                </div>

                <div className="hidden sm:block w-[1px] h-10 sm:h-14 bg-slate-800" />

                {/* Right: ROV Rank & Promotion Quest */}
                <div className="flex-1 w-full text-left sm:text-right flex flex-col items-start sm:items-end justify-center">
                  <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 sm:mb-2 block">
                    ระดับการจัดอันดับ (ROV Rank)
                  </span>
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="text-left sm:text-right">
                      <span className="font-display font-black text-xs sm:text-sm text-white block tracking-wide">
                        {profile.rank_tier}
                      </span>
                      <div className="mt-0.5 sm:mt-1 flex justify-start sm:justify-end">
                        {(() => {
                          const stars = profile.rank_stars || 0
                          const inPromotion = profile.is_in_promotion || false
                          if (inPromotion) {
                            return <span className="text-warning text-[8px] font-black animate-pulse uppercase tracking-wider bg-warning/10 border border-warning/30 px-1 py-0.5 rounded">PROMOTION QUEST ACTIVE 🎯</span>
                          }
                          const starList = []
                          for (let i = 0; i < 3; i++) {
                            starList.push(
                              <span key={i} className={`text-sm sm:text-base leading-none ${i < stars ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'text-slate-700'}`}>
                                ★
                              </span>
                            )
                          }
                          return <div className="flex gap-0.5 items-center">{starList}</div>
                        })()}
                      </div>
                    </div>
                  </div>

                  {lastGameResult.rankPromoted && (
                    <div className="mt-2 bg-success/15 border border-success/30 rounded-lg px-2 py-1 text-success text-[8px] sm:text-[10px] font-bold text-center">
                      🏆 เลื่อนระดับแร้งค์สำเร็จ! ➔ {profile.rank_tier}
                    </div>
                  )}

                  {profile.is_in_promotion && (
                    <div className="mt-2 bg-warning/10 border border-warning/20 rounded-lg p-2 text-left w-full">
                      <span className="text-[8px] font-black text-warning uppercase block tracking-wider mb-0.5">🔒 ภารกิจเลื่อนระดับ:</span>
                      <p className="text-[9px] sm:text-[10px] text-slate-350 leading-relaxed font-medium">{getQuestDetails(profile.rank_tier)?.description}</p>
                    </div>
                  )}

                  {lastGameResult.questCleared && (
                    <div className="mt-2 bg-success/15 border border-success/30 rounded-lg p-2 text-center w-full font-bold text-[8px] sm:text-[10px] text-success animate-pulse">
                      🎯 ผ่านเควสท้าทายและเลื่อนแรงค์สำเร็จ!
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Home Button (Desktop Only) */}
        <div className="hidden md:flex order-3 flex justify-center w-full">
          <button
            data-go-home-btn="true"
            onClick={onGoHome}
            className="relative overflow-hidden w-full max-w-xs md:h-64 py-4 md:py-0 rounded-2xl md:rounded-3xl bg-slate-800 border border-slate-700/60 hover:bg-slate-750 text-slate-200 font-display font-extrabold text-lg shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-row md:flex-col items-center justify-center gap-3 cursor-pointer select-none touch-target data-[hovered=true]:ring-2 data-[hovered=true]:ring-secondary/40 data-[hovered=true]:scale-105 data-[hovered=true]:ring-offset-2 data-[hovered=true]:ring-offset-slate-950"
          >
            <Home className="w-5 h-5 md:w-8 md:h-8 shrink-0" />
            <span className="text-center text-sm md:text-lg leading-tight">หน้าหลัก<br className="hidden md:inline" /> (Home)</span>
            <div
              data-go-home-progress="true"
              className="absolute bottom-0 left-0 h-1.5 md:h-2 bg-gradient-to-r from-secondary to-accent transition-all duration-75"
              style={{ width: '0%' }}
            />
          </button>
        </div>

      </div>
    </div>
  )
}
