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
    <div className="w-full max-w-3xl mx-auto flex flex-col justify-center items-center px-4 py-8 min-h-[80svh]">
      
      {/* Celebration Header */}
      <div className="text-center mb-6 relative animate-fade-in">
        <div className="absolute inset-0 bg-success/20 rounded-full blur-3xl opacity-30 transform scale-110 -z-10" />
        <Trophy className="w-16 h-16 text-warning mx-auto mb-3 animate-pulse" />
        <h1 className="font-display font-black text-3xl sm:text-4xl text-white">
          จบเกมการแข่งขัน!
        </h1>
        <p className="text-slate-400 text-sm mt-1 font-medium">
          ผลลัพธ์ยอดเยี่ยมจากการเรียนรู้ผ่านการเคลื่อนไหว
        </p>
      </div>

      {/* Main Score & Badge Card */}
      <div className="w-full glass-panel rounded-3xl p-6 border-slate-700/50 mb-8 max-w-xl text-center">
        {/* Badge Presentation */}
        <div className="mb-6 flex flex-col items-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">
            เกียรติยศระดับ (Badge Level)
          </span>
          <div className={`px-6 py-3.5 rounded-2xl bg-gradient-to-r ${badgeConfig.color} shadow-lg text-white font-display font-black text-xl tracking-wider uppercase animate-bounce [animation-duration:4s]`}>
            {badgeConfig.text}
          </div>
          <p className="text-xs text-slate-300 mt-3 max-w-xs leading-relaxed font-medium">
            {badgeConfig.desc}
          </p>
        </div>

        <div className="h-px bg-slate-800 my-4" />

        {/* Score metrics */}
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/40">
            <span className="text-xs text-slate-400 font-bold block mb-1">คะแนนรวมทั้งหมด</span>
            <span className="font-display font-black text-4xl text-white block tracking-tight">
              {stats.totalScore}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mt-1">
              POINTS
            </span>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/40 flex flex-col justify-center">
            <span className="text-xs text-slate-400 font-bold block mb-1">ความแม่นยำ</span>
            <span className="font-display font-black text-4xl text-secondary block tracking-tight">
              {stats.accuracy}%
            </span>
            <div className="w-full bg-slate-850 h-1.5 rounded-full overflow-hidden mt-2">
              <div 
                className="bg-secondary h-full rounded-full transition-all duration-1000" 
                style={{ width: `${stats.accuracy}%` }}
              />
            </div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4 text-left">
          <div className="bg-slate-900/40 px-3 py-2.5 rounded-xl border border-slate-800/30 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block leading-none mb-0.5">ถูกต้อง</span>
              <span className="text-xs text-slate-200 font-bold">{stats.correctCount} / {stats.correctCount + stats.wrongCount} ข้อ</span>
            </div>
          </div>
          <div className="bg-slate-900/40 px-3 py-2.5 rounded-xl border border-slate-800/30 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-danger shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block leading-none mb-0.5">ผิดพลาด</span>
              <span className="text-xs text-slate-200 font-bold">{stats.wrongCount} ข้อ</span>
            </div>
          </div>
          <div className="bg-slate-900/40 px-3 py-2.5 rounded-xl border border-slate-800/30 flex items-center gap-2">
            <Timer className="w-4 h-4 text-accent shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block leading-none mb-0.5">เวลาที่ใช้</span>
              <span className="text-xs text-slate-200 font-bold">{stats.timeUsed} วินาที</span>
            </div>
          </div>
        </div>
      </div>

      {/* EXP & Rank Progress Card */}
      {profile && lastGameResult && (
        <div className="w-full glass-panel rounded-3xl p-5 border-slate-700/50 mb-6 max-w-xl text-center relative overflow-hidden">
          {/* Left vertical visual accent bar */}
          <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-primary via-blue-500 to-secondary" />
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left: EXP & Level progress */}
            <div className="flex-1 w-full text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  พลังงานการเรียนรู้ (EXP & Level)
                </span>
                <span className="text-xs font-black text-amber-400 animate-pulse">
                  +{lastGameResult.earnedExp} EXP
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-white font-black text-sm shadow-md shrink-0 select-none">
                  Lvl {profile.level}
                </div>
                <div className="flex-1">
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-1000"
                      style={{ 
                        width: `${Math.min(100, ((profile.exp - (getLevelFromExp(profile.exp).prevLevelExpThreshold)) / ((getLevelFromExp(profile.exp).nextLevelExpThreshold) - (getLevelFromExp(profile.exp).prevLevelExpThreshold))) * 100)}%`
                      }}
                    />
                  </div>
                  <span className="text-[9px] text-slate-500 font-bold block mt-1">
                    {profile.exp} / {getLevelFromExp(profile.exp).nextLevelExpThreshold} EXP
                  </span>
                </div>
              </div>

              {lastGameResult.levelUp && (
                <div className="mt-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-1.5 flex items-center gap-2 justify-center text-amber-400 text-[10px] font-black animate-bounce">
                  🎉 เลเวลอัป! คุณระดับสูงขึ้นแล้ว! 🎉
                </div>
              )}
            </div>

            <div className="hidden md:block w-[1px] h-14 bg-slate-800" />

            {/* Right: ROV Rank & Promotion Quest */}
            <div className="flex-1 w-full text-center md:text-right flex flex-col items-center md:items-end justify-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                ระดับการจัดอันดับ (ROV Rank)
              </span>
              <div className="flex items-center gap-2.5">
                <div className="text-center md:text-right">
                  <span className="font-display font-black text-sm text-white block tracking-wide">
                    {profile.rank_tier}
                  </span>
                  <div className="mt-1 flex justify-center md:justify-end">
                    {(() => {
                      const stars = profile.rank_stars || 0
                      const inPromotion = profile.is_in_promotion || false
                      if (inPromotion) {
                        return <span className="text-warning text-[9px] font-black animate-pulse uppercase tracking-wider bg-warning/10 border border-warning/30 px-1.5 py-0.5 rounded-md">PROMOTION QUEST ACTIVE 🎯</span>
                      }
                      const starList = []
                      for (let i = 0; i < 3; i++) {
                        starList.push(
                          <span key={i} className={`text-base leading-none ${i < stars ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'text-slate-700'}`}>
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
                <div className="mt-3 bg-success/15 border border-success/30 rounded-xl px-3 py-1.5 text-success text-[10px] font-bold text-center">
                  🏆 เลื่อนระดับแร้งค์สำเร็จ! ➔ {profile.rank_tier}
                </div>
              )}

              {profile.is_in_promotion && (
                <div className="mt-3 bg-warning/10 border border-warning/20 rounded-xl p-2.5 text-left w-full">
                  <span className="text-[9px] font-black text-warning uppercase block tracking-wider mb-0.5">🔒 ภารกิจเลื่อนระดับ:</span>
                  <p className="text-[10px] text-slate-350 leading-relaxed font-medium">{getQuestDetails(profile.rank_tier)?.description}</p>
                </div>
              )}

              {lastGameResult.questCleared && (
                <div className="mt-3 bg-success/15 border border-success/30 rounded-xl p-2.5 text-center w-full font-bold text-[10px] text-success animate-pulse">
                  🎯 ผ่านเควสท้าทายและเลื่อนแรงค์สำเร็จ!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="w-full max-w-xl grid grid-cols-2 gap-4">
        <button
          onClick={onPlayAgain}
          className="py-4 rounded-2xl bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-white font-display font-extrabold text-lg shadow-lg shadow-primary/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-5 h-5" />
          เล่นอีกครั้ง (Play Again)
        </button>
        <button
          onClick={onGoHome}
          className="py-4 rounded-2xl bg-slate-800 border border-slate-700/60 hover:bg-slate-750 text-slate-200 font-display font-extrabold text-lg shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Home className="w-5 h-5" />
          หน้าหลัก (Home)
        </button>
      </div>
    </div>
  )
}
