import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getSessionStats } from '../lib/db'
import type { HistoricalSession } from '../lib/db'

interface DashboardScreenProps {
  onGoHome?: () => void
  isEmbedded?: boolean
}

// Badge color mapping
const BADGE_COLORS: Record<string, { bg: string; text: string; glow: string }> = {
  Bronze: { bg: 'from-amber-800 to-amber-600', text: 'text-amber-200', glow: 'shadow-amber-500/20' },
  Silver: { bg: 'from-gray-400 to-gray-300', text: 'text-gray-700', glow: 'shadow-gray-300/20' },
  Gold: { bg: 'from-yellow-500 to-amber-400', text: 'text-yellow-900', glow: 'shadow-yellow-400/30' },
  Platinum: { bg: 'from-cyan-400 to-teal-300', text: 'text-teal-900', glow: 'shadow-cyan-400/30' },
  Diamond: { bg: 'from-blue-400 to-indigo-300', text: 'text-indigo-900', glow: 'shadow-blue-400/30' },
  Master: { bg: 'from-purple-500 to-violet-400', text: 'text-violet-100', glow: 'shadow-purple-400/30' },
  Legend: { bg: 'from-rose-500 to-pink-400', text: 'text-pink-100', glow: 'shadow-rose-400/30' },
}

// Badge emoji mapping
const BADGE_EMOJI: Record<string, string> = {
  Bronze: '🥉',
  Silver: '🥈',
  Gold: '🥇',
  Platinum: '💎',
  Diamond: '💠',
  Master: '🏆',
  Legend: '⭐',
}

// Tab names for the dashboard
type DashboardTab = 'overview' | 'history' | 'achievements'

export function DashboardScreen({ onGoHome, isEmbedded = false }: DashboardScreenProps) {
  const [stats, setStats] = useState(getSessionStats())
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')
  const chartCanvasRef = useRef<HTMLCanvasElement>(null)
  const badgeCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    setStats(getSessionStats())
  }, [])

  // Draw score line chart
  useEffect(() => {
    const canvas = chartCanvasRef.current
    if (!canvas || stats.scoreOverTime.length === 0) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const width = rect.width
    const height = rect.height
    const padding = { top: 20, right: 20, bottom: 40, left: 50 }
    const chartW = width - padding.left - padding.right
    const chartH = height - padding.top - padding.bottom

    const data = stats.scoreOverTime
    const maxScore = 75
    const minScore = 0

    // Clear
    ctx.clearRect(0, 0, width, height)

    // Grid lines
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartH / 5) * i
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(width - padding.right, y)
      ctx.stroke()

      // Y-axis labels
      const val = Math.round(maxScore - (maxScore / 5) * i)
      ctx.fillStyle = 'rgba(148, 163, 184, 0.6)'
      ctx.font = '11px Inter, sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(val.toString(), padding.left - 8, y + 4)
    }

    if (data.length < 2) {
      // Single point - draw a dot
      const x = padding.left + chartW / 2
      const y = padding.top + chartH - ((data[0].score - minScore) / (maxScore - minScore)) * chartH
      
      ctx.beginPath()
      ctx.arc(x, y, 6, 0, Math.PI * 2)
      ctx.fillStyle = '#2563eb'
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()

      // Label
      ctx.fillStyle = 'rgba(148, 163, 184, 0.8)'
      ctx.font = '10px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(data[0].date, x, height - padding.bottom + 20)
      return
    }

    // Calculate points
    const points = data.map((d, i) => ({
      x: padding.left + (i / (data.length - 1)) * chartW,
      y: padding.top + chartH - ((d.score - minScore) / (maxScore - minScore)) * chartH
    }))

    // Gradient fill under line
    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH)
    gradient.addColorStop(0, 'rgba(37, 99, 235, 0.3)')
    gradient.addColorStop(1, 'rgba(37, 99, 235, 0.02)')

    ctx.beginPath()
    ctx.moveTo(points[0].x, padding.top + chartH)
    ctx.lineTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      const cx = (points[i - 1].x + points[i].x) / 2
      ctx.bezierCurveTo(cx, points[i - 1].y, cx, points[i].y, points[i].x, points[i].y)
    }
    ctx.lineTo(points[points.length - 1].x, padding.top + chartH)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    // Line
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      const cx = (points[i - 1].x + points[i].x) / 2
      ctx.bezierCurveTo(cx, points[i - 1].y, cx, points[i].y, points[i].x, points[i].y)
    }
    ctx.strokeStyle = '#2563eb'
    ctx.lineWidth = 2.5
    ctx.stroke()

    // Dots and labels
    points.forEach((p, i) => {
      // Glow
      ctx.beginPath()
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(37, 99, 235, 0.2)'
      ctx.fill()

      // Dot
      ctx.beginPath()
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
      ctx.fillStyle = '#2563eb'
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // X labels (show only every N)
      const showEvery = Math.max(1, Math.floor(data.length / 8))
      if (i % showEvery === 0 || i === data.length - 1) {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.8)'
        ctx.font = '10px Inter, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(data[i].date, p.x, height - padding.bottom + 20)
      }
    })
  }, [stats.scoreOverTime, activeTab])

  // Draw badge distribution chart
  useEffect(() => {
    const canvas = badgeCanvasRef.current
    if (!canvas || Object.keys(stats.badgeDistribution).length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const width = rect.width
    const height = rect.height
    const padding = { top: 10, right: 20, bottom: 40, left: 20 }

    const badges = Object.entries(stats.badgeDistribution)
    const maxCount = Math.max(...badges.map(([, v]) => v))
    const barWidth = Math.min(50, (width - padding.left - padding.right) / badges.length - 12)
    const chartH = height - padding.top - padding.bottom

    ctx.clearRect(0, 0, width, height)

    const barColors = ['#92400e', '#9ca3af', '#eab308', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899']

    badges.forEach(([badge, count], i) => {
      const x = padding.left + (i + 0.5) * ((width - padding.left - padding.right) / badges.length)
      const barH = (count / maxCount) * chartH * 0.85
      const y = padding.top + chartH - barH

      // Bar with rounded top
      const radius = Math.min(6, barWidth / 2)
      const color = barColors[i % barColors.length]

      // Shadow glow
      ctx.shadowColor = color
      ctx.shadowBlur = 12
      ctx.shadowOffsetY = 4

      ctx.beginPath()
      ctx.moveTo(x - barWidth / 2, y + radius)
      ctx.arcTo(x - barWidth / 2, y, x, y, radius)
      ctx.arcTo(x + barWidth / 2, y, x + barWidth / 2, y + radius, radius)
      ctx.lineTo(x + barWidth / 2, padding.top + chartH)
      ctx.lineTo(x - barWidth / 2, padding.top + chartH)
      ctx.closePath()

      const grad = ctx.createLinearGradient(x, y, x, padding.top + chartH)
      grad.addColorStop(0, color)
      grad.addColorStop(1, color + '44')
      ctx.fillStyle = grad
      ctx.fill()

      // Reset shadow
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetY = 0

      // Count label on top
      ctx.fillStyle = '#e2e8f0'
      ctx.font = 'bold 12px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(count.toString(), x, y - 6)

      // Badge label below
      ctx.fillStyle = 'rgba(148, 163, 184, 0.8)'
      ctx.font = '10px Inter, sans-serif'
      ctx.fillText(badge, x, height - padding.bottom + 18)
    })
  }, [stats.badgeDistribution, activeTab])

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <motion.div
      className="w-full max-w-6xl mx-auto"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      {!isEmbedded && (
        <motion.div variants={itemVariants} className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              id="dashboard-back-btn"
              onClick={onGoHome}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                📊 Teacher Dashboard
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">Learning Analytics & Performance Tracking</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tab Navigation */}
      <motion.div variants={itemVariants} className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10 mb-6 w-fit">
        {(['overview', 'history', 'achievements'] as DashboardTab[]).map((tab) => (
          <button
            key={tab}
            id={`tab-${tab}`}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === tab
                ? 'bg-primary text-white shadow-lg shadow-primary/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            {tab === 'overview' && '📈 '}
            {tab === 'history' && '📋 '}
            {tab === 'achievements' && '🏆 '}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </motion.div>

      {/* No Data State */}
      {stats.totalGames === 0 && (
        <motion.div
          variants={itemVariants}
          className="text-center py-16 rounded-2xl bg-white/5 border border-white/10"
        >
          <div className="text-6xl mb-4">🎮</div>
          <h2 className="text-xl font-bold text-white mb-2">ยังไม่มีข้อมูล</h2>
          <p className="text-slate-400 text-sm mb-6">เล่นเกมสักรอบเพื่อเริ่มดูสถิติ</p>
          {!isEmbedded && onGoHome && (
            <button
              onClick={onGoHome}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-sm shadow-lg shadow-primary/25 hover:scale-105 transition-transform"
            >
              🎯 เริ่มเล่นเกม
            </button>
          )}
        </motion.div>
      )}

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {stats.totalGames > 0 && activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Stat Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <StatCard emoji="🎮" label="เกมทั้งหมด" value={stats.totalGames.toString()} color="primary" />
              <StatCard emoji="🎯" label="คะแนนเฉลี่ย" value={`${stats.avgScore}/75`} color="secondary" />
              <StatCard emoji="✅" label="ความแม่นเฉลี่ย" value={`${stats.avgAccuracy}%`} color="success" />
              <StatCard emoji="🔥" label="Max Combo" value={`x${stats.bestCombo}`} color="warning" />
            </div>

            {/* Secondary Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <StatCard emoji="🏆" label="คะแนนสูงสุด" value={stats.bestScore.toString()} color="accent" />
              <StatCard emoji="💯" label="Accuracy สูงสุด" value={`${stats.bestAccuracy}%`} color="success" />
              <StatCard emoji="✓" label="ตอบถูก" value={stats.totalCorrect.toString()} color="success" />
              <StatCard emoji="✗" label="ตอบผิด" value={stats.totalWrong.toString()} color="danger" />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Score Over Time Chart */}
              <motion.div
                variants={itemVariants}
                className="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm"
              >
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  📈 คะแนนตามเวลา
                  <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">Score Trend</span>
                </h3>
                <canvas
                  ref={chartCanvasRef}
                  className="w-full"
                  style={{ height: '200px' }}
                />
              </motion.div>

              {/* Badge Distribution Chart */}
              <motion.div
                variants={itemVariants}
                className="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm"
              >
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  🏅 Badge ที่ได้รับ
                  <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded-full">Distribution</span>
                </h3>
                <canvas
                  ref={badgeCanvasRef}
                  className="w-full"
                  style={{ height: '200px' }}
                />
              </motion.div>
            </div>
          </motion.div>
        )}

        {stats.totalGames > 0 && activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Leaderboard Table */}
            <motion.div
              variants={itemVariants}
              className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm overflow-hidden"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  📋 ประวัติการเล่น
                  <span className="text-[10px] bg-secondary/20 text-secondary px-2 py-0.5 rounded-full">
                    {stats.recentSessions.length} รายการล่าสุด
                  </span>
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left text-slate-400 font-medium px-4 py-3 text-xs">#</th>
                      <th className="text-left text-slate-400 font-medium px-4 py-3 text-xs">วันเวลา</th>
                      <th className="text-center text-slate-400 font-medium px-4 py-3 text-xs">คะแนน</th>
                      <th className="text-center text-slate-400 font-medium px-4 py-3 text-xs">ถูก/ผิด</th>
                      <th className="text-center text-slate-400 font-medium px-4 py-3 text-xs">Accuracy</th>
                      <th className="text-center text-slate-400 font-medium px-4 py-3 text-xs">Combo</th>
                      <th className="text-center text-slate-400 font-medium px-4 py-3 text-xs">เวลา</th>
                      <th className="text-center text-slate-400 font-medium px-4 py-3 text-xs">Badge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentSessions.map((session: HistoricalSession, index: number) => (
                      <motion.tr
                        key={session.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className={`font-bold ${
                            index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-amber-600' : 'text-slate-500'
                          }`}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300 text-xs">{formatDate(session.playedAt)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-bold text-white bg-primary/20 px-2 py-0.5 rounded-lg text-xs">
                            {session.totalScore}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-green-400 font-bold text-xs">{session.correctCount}</span>
                          <span className="text-slate-600 mx-1">/</span>
                          <span className="text-red-400 font-bold text-xs">{session.wrongCount}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${session.accuracy}%`,
                                  background: session.accuracy >= 80 ? '#22c55e' : session.accuracy >= 60 ? '#eab308' : '#ef4444'
                                }}
                              />
                            </div>
                            <span className="text-xs text-slate-300 font-medium">{session.accuracy}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-warning font-bold text-xs">x{session.maxCombo}</span>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-400 text-xs">{session.timeUsed}s</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-gradient-to-r ${
                            BADGE_COLORS[session.earnedBadge]?.bg || 'from-slate-600 to-slate-500'
                          } ${BADGE_COLORS[session.earnedBadge]?.text || 'text-white'}`}>
                            {BADGE_EMOJI[session.earnedBadge] || '🏅'} {session.earnedBadge}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        )}

        {stats.totalGames > 0 && activeTab === 'achievements' && (
          <motion.div
            key="achievements"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Badge Showcase */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
              {Object.entries(BADGE_COLORS).map(([badge, colors]) => {
                const count = stats.badgeDistribution[badge] || 0
                const unlocked = count > 0

                return (
                  <motion.div
                    key={badge}
                    variants={itemVariants}
                    className={`relative rounded-2xl border p-5 text-center transition-all duration-300 ${
                      unlocked
                        ? `bg-white/5 border-white/15 ${colors.glow} shadow-lg hover:scale-105`
                        : 'bg-white/[0.02] border-white/5 opacity-40 grayscale'
                    }`}
                  >
                    <div className="text-4xl mb-2">
                      {BADGE_EMOJI[badge]}
                    </div>
                    <h4 className={`font-bold text-sm mb-1 ${unlocked ? 'text-white' : 'text-slate-500'}`}>
                      {badge}
                    </h4>
                    {unlocked ? (
                      <p className="text-xs text-slate-400">
                        ได้รับ <span className="text-white font-bold">{count}</span> ครั้ง
                      </p>
                    ) : (
                      <p className="text-xs text-slate-600">🔒 ยังไม่ปลดล็อก</p>
                    )}
                    {unlocked && (
                      <div className="absolute top-2 right-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>

            {/* Performance Summary Card */}
            <motion.div
              variants={itemVariants}
              className="rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-accent/10 border border-white/10 p-6 backdrop-blur-sm"
            >
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                📊 สรุปผลการเรียนรู้
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-display font-bold text-primary">{stats.totalGames}</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">Total Games</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-display font-bold text-green-400">{stats.totalCorrect}</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">Total Correct</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-display font-bold text-warning">{stats.avgTimeUsed}s</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">Avg Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-display font-bold text-accent">
                    {Object.keys(stats.badgeDistribution).length}/{Object.keys(BADGE_COLORS).length}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">Badges Unlocked</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Reusable Stat Card component
function StatCard({ emoji, label, value, color }: { emoji: string; label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    primary: 'from-primary/20 to-primary/5 border-primary/20',
    secondary: 'from-secondary/20 to-secondary/5 border-secondary/20',
    success: 'from-green-500/20 to-green-500/5 border-green-500/20',
    warning: 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/20',
    danger: 'from-red-500/20 to-red-500/5 border-red-500/20',
    accent: 'from-accent/20 to-accent/5 border-accent/20',
  }

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, scale: 0.9 },
        visible: { opacity: 1, scale: 1 }
      }}
      className={`rounded-xl bg-gradient-to-br ${colorMap[color]} border p-4 backdrop-blur-sm hover:scale-105 transition-transform duration-200`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{emoji}</span>
        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">{label}</span>
      </div>
      <div className="text-xl font-display font-bold text-white">{value}</div>
    </motion.div>
  )
}
