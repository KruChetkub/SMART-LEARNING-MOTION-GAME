import { useEffect, useRef, useState, type RefObject } from 'react'

export interface HandCursor {
  x: number
  y: number
  isTracking: boolean
  landmarks: Array<{ x: number; y: number }> | null
  isPinching: boolean
  label: 'Left' | 'Right'
}

export interface MediaPipeTrackingResult {
  hands: HandCursor[]
}

export const useMediaPipe = (
  videoRef: RefObject<HTMLVideoElement | null>,
  isActive: boolean,
  cameraRotation: number = 0,
  mirrorHorizontal: boolean = false
): MediaPipeTrackingResult => {
  const [cursor, setCursor] = useState<MediaPipeTrackingResult>({ hands: [] })

  // Point 3: All intermediate values live in useRef -- never trigger renders
  const lastCursorRef = useRef<MediaPipeTrackingResult>({ hands: [] })
  const lastStateUpdateTimeRef = useRef<number>(0)

  const cameraRotationRef = useRef(cameraRotation)
  const mirrorHorizontalRef = useRef(mirrorHorizontal)
  // Point 2+3: isActiveRef lets processFrame/onResults read isActive without being in deps
  const isActiveRef = useRef(isActive)

  // Hook-level refs: accessible in cleanup no matter when it runs
  const animationFrameIdRef = useRef<number>(-1)
  const handsRef = useRef<any>(null)

  // Lightweight sync effects -- only update refs, never restart MediaPipe
  useEffect(() => { cameraRotationRef.current = cameraRotation }, [cameraRotation])
  useEffect(() => { mirrorHorizontalRef.current = mirrorHorizontal }, [mirrorHorizontal])
  useEffect(() => {
    isActiveRef.current = isActive
    // When camera turns off, clear cursor immediately using functional update (Point 2)
    if (!isActive) {
      setCursor(prev => {
        if (prev.hands.length === 0) return prev
        const cleared = { hands: [] as HandCursor[] }
        lastCursorRef.current = cleared
        return cleared
      })
    }
  }, [isActive])

  // Point 1: Empty [] -- MediaPipe is initialized ONCE on mount and NEVER restarted.
  useEffect(() => {
    let isProcessing = false
    let lastFrameTime = 0
    let mounted = true

    const onResults = (results: any) => {
      if (!mounted || !isActiveRef.current) return

      const activeHands: HandCursor[] = []

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const numHands = Math.min(results.multiHandLandmarks.length, 2)
        for (let i = 0; i < numHands; i++) {
          const landmarks = results.multiHandLandmarks[i]
          const indexFingerTip = landmarks[8]
          const handedness = results.multiHandedness ? results.multiHandedness[i] : null
          const label = handedness ? handedness.label : (i === 0 ? 'Left' : 'Right')

          if (indexFingerTip) {
            const normalized = ((cameraRotationRef.current % 360) + 360) % 360
            const video = videoRef.current
            let Rc = 1
            let Rv = 1
            if (video && video.videoWidth && video.videoHeight && video.clientWidth && video.clientHeight) {
              Rc = video.clientWidth / video.clientHeight
              Rv = video.videoWidth / video.videoHeight
            }

            const transformPoint = (pt: any) => {
              let cx = pt.x
              let cy = pt.y
              if (Rc > Rv) { cy = (pt.y - 0.5) * (Rc / Rv) + 0.5 }
              else if (Rc < Rv) { cx = (pt.x - 0.5) * (Rv / Rc) + 0.5 }
              let px = cx * 100
              let py = cy * 100
              if (normalized === 0) {
                px = mirrorHorizontalRef.current ? (1 - cx) * 100 : cx * 100
                py = cy * 100
              } else if (normalized === 90) {
                px = mirrorHorizontalRef.current ? cy * 100 : (1 - cy) * 100
                py = cx * 100
              } else if (normalized === 180) {
                px = mirrorHorizontalRef.current ? cx * 100 : (1 - cx) * 100
                py = (1 - cy) * 100
              } else if (normalized === 270) {
                px = mirrorHorizontalRef.current ? (1 - cy) * 100 : cy * 100
                py = (1 - cx) * 100
              } else {
                const radians = (normalized * Math.PI) / 180
                const centeredX = cx - 0.5
                const centeredY = cy - 0.5
                const rotatedX = centeredX * Math.cos(radians) - centeredY * Math.sin(radians)
                const rotatedY = centeredX * Math.sin(radians) + centeredY * Math.cos(radians)
                px = (1 - (rotatedX + 0.5)) * 100
                py = (rotatedY + 0.5) * 100
              }
              return { x: px, y: py }
            }

            const normalizedLandmarks = landmarks.map((lm: any) => transformPoint(lm))
            const tip = transformPoint(indexFingerTip)

            const thumb = landmarks[4]
            let isPinching = false
            if (thumb && indexFingerTip) {
              const dx = thumb.x - indexFingerTip.x
              const dy = thumb.y - indexFingerTip.y
              const distance = Math.sqrt(dx * dx + dy * dy)
              const wrist = landmarks[0]
              const middleMcp = landmarks[9]
              let palmSize = 0.15
              if (wrist && middleMcp) {
                const pdx = wrist.x - middleMcp.x
                const pdy = wrist.y - middleMcp.y
                palmSize = Math.sqrt(pdx * pdx + pdy * pdy)
                if (palmSize < 0.04) palmSize = 0.15
              }
              const relativeDistance = distance / palmSize
              isPinching = relativeDistance < 0.45
              if (distance < 0.04) isPinching = true
              else if (distance > 0.18) isPinching = false
            }

            activeHands.push({
              x: tip.x,
              y: tip.y,
              isTracking: true,
              landmarks: normalizedLandmarks,
              isPinching,
              label: label as 'Left' | 'Right'
            })
          }
        }
      }

      // Point 3: Compare against lastCursorRef -- no state read required
      const next = { hands: activeHands }
      const last = lastCursorRef.current
      let changed = last.hands.length !== next.hands.length
      if (!changed) {
        for (let i = 0; i < next.hands.length; i++) {
          const lH = last.hands[i]
          const nH = next.hands[i]
          if (!lH || !nH || Math.abs(lH.x - nH.x) > 0.15 || Math.abs(lH.y - nH.y) > 0.15 || lH.label !== nH.label || lH.isPinching !== nH.isPinching) {
            changed = true
            break
          }
        }
      }

      if (changed) {
        const now = performance.now()
        if (now - lastStateUpdateTimeRef.current >= 45) {
          lastStateUpdateTimeRef.current = now
          lastCursorRef.current = next
          // Point 2: Functional update -- never reads stale state from closure
          setCursor(() => next)
        }
      }
    }

    const processFrame = async () => {
      if (!mounted) return
      // Read isActive via ref -- no dependency needed (Point 2+3)
      if (isActiveRef.current && handsRef.current) {
        const video = videoRef.current
        if (video && !video.paused && video.readyState >= 3) {
          const now = performance.now()
          // 45 FPS balanced cross-device throttle
          if (now - lastFrameTime >= 22 && !isProcessing) {
            lastFrameTime = now
            isProcessing = true
            try {
              await handsRef.current.send({ image: video })
            } catch (e) {
              // silent
            } finally {
              isProcessing = false
            }
          }
        }
      }
      // Store the next frame ID in ref so cleanup can always cancel it
      if (mounted) animationFrameIdRef.current = requestAnimationFrame(processFrame)
    }

    const initializeMediaPipe = () => {
      if (!mounted) return
      try {
        if (!window.Hands) {
          console.log('MediaPipe Hands not ready. Retrying in 500ms...')
          if (mounted) setTimeout(initializeMediaPipe, 500)
          return
        }
        handsRef.current = new window.Hands({
          locateFile: (file: string) => {
            return 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/' + file
          }
        })
        handsRef.current.setOptions({
          maxNumHands: 2,
          modelComplexity: 0,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        })
        handsRef.current.onResults(onResults)
        // Store first frame ID in the hook-level ref
        animationFrameIdRef.current = requestAnimationFrame(processFrame)
      } catch (err) {
        console.error('Failed to initialize MediaPipe:', err)
      }
    }

    const startupTimeout = setTimeout(initializeMediaPipe, 800)

    return () => {
      mounted = false
      clearTimeout(startupTimeout)
      // Cancel the loop using hook-level ref -- always the latest frame ID
      if (animationFrameIdRef.current !== -1) {
        cancelAnimationFrame(animationFrameIdRef.current)
        animationFrameIdRef.current = -1
      }
      // Close MediaPipe using hook-level ref
      if (handsRef.current) {
        try { handsRef.current.close() } catch (e) {}
        handsRef.current = null
      }
    }
  }, [])  // Point 1: Empty array -- MediaPipe initializes exactly ONCE on mount

  return cursor
}
