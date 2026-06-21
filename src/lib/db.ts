import { supabase, isSupabaseConfigured } from './supabase'
import type { GameStats } from '../types/game'

export interface HistoricalSession extends GameStats {
  id: string
  playedAt: string
}

// LocalStorage key constants
const SESSIONS_KEY = 'smart-math-sessions'

/**
 * Saves a completed game session.
 * Connects to Supabase if configured; always records to LocalStorage fallback.
 */
export const saveGameSession = async (stats: GameStats): Promise<HistoricalSession> => {
  const uuid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11)
  const sessionRecord: HistoricalSession = {
    ...stats,
    id: uuid,
    playedAt: new Date().toISOString()
  }

  // 1. LocalStorage Fallback (always persists)
  try {
    const existing = localStorage.getItem(SESSIONS_KEY)
    const sessions = existing ? JSON.parse(existing) : []
    sessions.push(sessionRecord)
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
  } catch (e) {
    console.error('Failed to save to local storage:', e)
  }

  // 2. Supabase Integration
  if (isSupabaseConfigured()) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase
        .from('game_sessions')
        .insert({
          user_id: user?.id || null,
          score: stats.totalScore,
          correct_count: stats.correctCount,
          wrong_count: stats.wrongCount,
          accuracy: stats.accuracy,
          time_used: stats.timeUsed,
          earned_badge: stats.earnedBadge,
          rank: stats.rank,
          max_combo: stats.maxCombo
        })
      
      if (error) {
        console.error('Supabase insert session error:', error.message)
      } else {
        console.log('Successfully saved session to Supabase!')
      }

      // Also save to leaderboard
      let playerName = 'ผู้เล่นทั่วไป'
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single()
        if (profileData?.display_name) {
          playerName = profileData.display_name
        } else if (user.email) {
          playerName = user.email.split('@')[0]
        }
      }

      const { error: leaderboardError } = await supabase
        .from('leaderboard')
        .insert({
          user_id: user?.id || null,
          player_name: playerName,
          score: stats.totalScore,
          accuracy: stats.accuracy
        })
      
      if (leaderboardError) {
        console.error('Supabase insert leaderboard error:', leaderboardError.message)
      }
    } catch (e) {
      console.error('Failed to save to Supabase:', e)
    }
  }

  return sessionRecord
}

/**
 * Retrieves leaderboard scoreboard rankings.
 * Returns sorted local sessions as fallback if Supabase is offline.
 */
export const getLeaderboard = async (limit: number = 10): Promise<any[]> => {
  // If Supabase is configured, try pulling records
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('player_name, score, accuracy, played_at')
        .order('score', { ascending: false })
        .limit(limit)

      if (!error && data && data.length > 0) {
        return data.map(item => ({
          playerName: item.player_name,
          score: item.score,
          accuracy: item.accuracy,
          playedAt: item.played_at
        }))
      }
    } catch (e) {
      console.warn('Failed to query Supabase leaderboard, falling back to local:', e)
    }
  }

  // Fallback: local storage
  try {
    const existing = localStorage.getItem(SESSIONS_KEY)
    const sessions: HistoricalSession[] = existing ? JSON.parse(existing) : []
    
    // Sort descending by score, then accuracy
    const sorted = [...sessions].sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore
      return b.accuracy - a.accuracy
    })

    return sorted.slice(0, limit).map(item => ({
      playerName: 'ผู้เล่นทั่วไป',
      score: item.totalScore,
      accuracy: item.accuracy,
      playedAt: item.playedAt
    }))
  } catch (e) {
    console.error('Failed to parse local leaderboard:', e)
    return []
  }
}

/**
 * Retrieves all session history records from local storage.
 */
export const getSessionHistory = (): HistoricalSession[] => {
  try {
    const existing = localStorage.getItem(SESSIONS_KEY)
    return existing ? JSON.parse(existing) : []
  } catch (e) {
    console.error('Failed to parse local sessions:', e)
    return []
  }
}

/**
 * Computes aggregate statistics from all historical sessions.
 */
export const getSessionStats = () => {
  const sessions = getSessionHistory()
  
  if (sessions.length === 0) {
    return {
      totalGames: 0,
      avgScore: 0,
      avgAccuracy: 0,
      bestScore: 0,
      bestAccuracy: 0,
      totalCorrect: 0,
      totalWrong: 0,
      avgTimeUsed: 0,
      bestCombo: 0,
      recentSessions: [] as HistoricalSession[],
      scoreOverTime: [] as { date: string; score: number }[],
      badgeDistribution: {} as Record<string, number>
    }
  }

  const totalGames = sessions.length
  const avgScore = Math.round(sessions.reduce((sum, s) => sum + s.totalScore, 0) / totalGames)
  const avgAccuracy = Math.round(sessions.reduce((sum, s) => sum + s.accuracy, 0) / totalGames)
  const bestScore = Math.max(...sessions.map(s => s.totalScore))
  const bestAccuracy = Math.max(...sessions.map(s => s.accuracy))
  const totalCorrect = sessions.reduce((sum, s) => sum + s.correctCount, 0)
  const totalWrong = sessions.reduce((sum, s) => sum + s.wrongCount, 0)
  const avgTimeUsed = Math.round(sessions.reduce((sum, s) => sum + s.timeUsed, 0) / totalGames)
  const bestCombo = Math.max(...sessions.map(s => s.maxCombo))

  // Recent sessions (last 10, newest first)
  const recentSessions = [...sessions].sort((a, b) => 
    new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime()
  ).slice(0, 10)

  // Score over time for chart
  const scoreOverTime = [...sessions]
    .sort((a, b) => new Date(a.playedAt).getTime() - new Date(b.playedAt).getTime())
    .map((s, index) => ({
      date: `Game ${index + 1}`,
      score: s.totalScore
    }))

  // Badge distribution
  const badgeDistribution: Record<string, number> = {}
  sessions.forEach(s => {
    badgeDistribution[s.earnedBadge] = (badgeDistribution[s.earnedBadge] || 0) + 1
  })

  return {
    totalGames,
    avgScore,
    avgAccuracy,
    bestScore,
    bestAccuracy,
    totalCorrect,
    totalWrong,
    avgTimeUsed,
    bestCombo,
    recentSessions,
    scoreOverTime,
    badgeDistribution
  }
}

/**
 * Clears all session history from local storage.
 */
export const clearSessions = () => {
  try {
    localStorage.removeItem(SESSIONS_KEY)
  } catch (e) {
    console.error('Failed to clear sessions:', e)
  }
}

