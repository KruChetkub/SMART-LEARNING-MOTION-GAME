let audioCtx: AudioContext | null = null

const getAudioContext = (): AudioContext => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

/**
 * Plays a pleasant ascending 8-bit retro arpeggio for correct answers.
 */
export const playCorrectSound = (enabled: boolean = true) => {
  if (!enabled) return
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()

    osc.type = 'triangle' // Triangle wave has a retro flute/arcade sound
    osc.connect(gainNode)
    gainNode.connect(ctx.destination)

    osc.frequency.setValueAtTime(523.25, now) // C5
    osc.frequency.setValueAtTime(659.25, now + 0.06) // E5
    osc.frequency.setValueAtTime(783.99, now + 0.12) // G5
    osc.frequency.setValueAtTime(1046.50, now + 0.18) // C6

    gainNode.gain.setValueAtTime(0.12, now)
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3)

    osc.start(now)
    osc.stop(now + 0.3)
  } catch (e) {
    console.warn('Audio play correct sound failed:', e)
  }
}

/**
 * Plays a low descending buzz/vibrato for incorrect answers.
 */
export const playWrongSound = (enabled: boolean = true) => {
  if (!enabled) return
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()

    osc.type = 'sawtooth' // Sawtooth wave gives a nice arcade buzz
    osc.connect(gainNode)
    gainNode.connect(ctx.destination)

    osc.frequency.setValueAtTime(196.00, now) // G3
    osc.frequency.linearRampToValueAtTime(98.00, now + 0.22) // G2 (descending pitch)

    gainNode.gain.setValueAtTime(0.12, now)
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25)

    osc.start(now)
    osc.stop(now + 0.25)
  } catch (e) {
    console.warn('Audio play wrong sound failed:', e)
  }
}

/**
 * Plays a short, high-pitched sine beep for timer countdown ticks.
 */
export const playTickSound = (enabled: boolean = true) => {
  if (!enabled) return
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()

    osc.type = 'sine' // Clean clock click sound
    osc.connect(gainNode)
    gainNode.connect(ctx.destination)

    osc.frequency.setValueAtTime(880.00, now) // High beep (A5)

    gainNode.gain.setValueAtTime(0.08, now)
    gainNode.gain.exponentialRampToValueAtTime(0.005, now + 0.05)

    osc.start(now)
    osc.stop(now + 0.05)
  } catch (e) {
    console.warn('Audio play tick sound failed:', e)
  }
}

/**
 * Plays an upbeat arcade fanfare melody for victory.
 */
export const playVictorySound = (enabled: boolean = true) => {
  if (!enabled) return
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime

    // Retro fanfare melody arpeggios
    const notes = [
      { f: 261.63, t: 0.0 },  // C4
      { f: 329.63, t: 0.08 }, // E4
      { f: 392.00, t: 0.16 }, // G4
      { f: 523.25, t: 0.24 }, // C5
      { f: 392.00, t: 0.32 }, // G4
      { f: 523.25, t: 0.40 }, // C5
      { f: 659.25, t: 0.48 }  // E5 (sustained chord)
    ]

    notes.forEach((note) => {
      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()

      osc.type = 'triangle'
      osc.connect(gainNode)
      gainNode.connect(ctx.destination)

      osc.frequency.setValueAtTime(note.f, now + note.t)

      const start = now + note.t
      const isLast = note.f === 659.25
      const duration = isLast ? 0.6 : 0.15

      gainNode.gain.setValueAtTime(0.1, start)
      gainNode.gain.exponentialRampToValueAtTime(0.005, start + duration)

      osc.start(start)
      osc.stop(start + duration)
    })
  } catch (e) {
    console.warn('Audio play victory sound failed:', e)
  }
}
