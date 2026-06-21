import { useEffect, useRef, useState, type RefObject } from 'react'

export interface CursorPosition {
  x: number
  y: number
  isTracking: boolean
  landmarks: Array<{ x: number; y: number }> | null
  isPinching: boolean
}

export const useMediaPipe = (
  videoRef: RefObject<HTMLVideoElement | null>,
  isActive: boolean,
  cameraRotation: number = 0,
  mirrorHorizontal: boolean = false
): CursorPosition => {
  const [cursor, setCursor] = useState<CursorPosition>({ x: 50, y: 50, isTracking: false, landmarks: null, isPinching: false })
  const lastCursorRef = useRef<CursorPosition>(cursor)

  useEffect(() => {
    if (!isActive || !videoRef.current) {
      setCursor(prev => {
        if (!prev.isTracking) return prev
        const next = { ...prev, isTracking: false, landmarks: null, isPinching: false }
        lastCursorRef.current = next
        return next
      })
      return
    }

    let hands: any = null
    let active = true

    const onResults = (results: any) => {
      if (!active) return

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0]
        // Landmark 8: INDEX_FINGER_TIP
        const indexFingerTip = landmarks[8]

        if (indexFingerTip) {
          const normalized = ((cameraRotation % 360) + 360) % 360
          
          const video = videoRef.current
          let Rc = 1
          let Rv = 1
          if (video && video.videoWidth && video.videoHeight && video.clientWidth && video.clientHeight) {
            Rc = video.clientWidth / video.clientHeight
            Rv = video.videoWidth / video.videoHeight
          }

          const transformPoint = (pt: any) => {
            // 1. Correct for object-cover cropping based on aspect ratio difference
            let cx = pt.x
            let cy = pt.y
            if (Rc > Rv) {
              // Container is wider than video (cropped vertically)
              cy = (pt.y - 0.5) * (Rc / Rv) + 0.5
            } else if (Rc < Rv) {
              // Container is taller than video (cropped horizontally)
              cx = (pt.x - 0.5) * (Rv / Rc) + 0.5
            }

            // 2. Apply rotation and horizontal mirroring
            let px = cx * 100
            let py = cy * 100

            if (normalized === 0) {
              px = mirrorHorizontal ? (1 - cx) * 100 : cx * 100
              py = cy * 100
            } else if (normalized === 90) {
              px = mirrorHorizontal ? cy * 100 : (1 - cy) * 100
              py = cx * 100
            } else if (normalized === 180) {
              px = mirrorHorizontal ? cx * 100 : (1 - cx) * 100
              py = (1 - cy) * 100
            } else if (normalized === 270) {
              px = mirrorHorizontal ? (1 - cy) * 100 : cy * 100
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

          const normalizedLandmarks = landmarks.map((landmark: any) => transformPoint(landmark))
          const indexFingerTipTransformed = transformPoint(indexFingerTip)
          const xPercent = indexFingerTipTransformed.x
          const yPercent = indexFingerTipTransformed.y

          const last = lastCursorRef.current
          const wasPinching = last ? last.isPinching : false

          const thumb = landmarks[4]
          let isPinching = false
          if (thumb && indexFingerTip) {
            const dx = thumb.x - indexFingerTip.x
            const dy = thumb.y - indexFingerTip.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            
            // Calculate palm size dynamically (Wrist [0] to Middle Finger MCP [9])
            const wrist = landmarks[0]
            const middleMcp = landmarks[9]
            let palmSize = 0.15 // Default fallback
            if (wrist && middleMcp) {
              const pdx = wrist.x - middleMcp.x
              const pdy = wrist.y - middleMcp.y
              palmSize = Math.sqrt(pdx * pdx + pdy * pdy)
              if (palmSize < 0.04) palmSize = 0.15 // Safety bounds
            }

            const relativeDistance = distance / palmSize
            
            // Hysteresis based on normalized palm ratio:
            // strict 0.45 to start, relaxed 0.75 to release
            const threshold = wasPinching ? 0.75 : 0.45
            isPinching = relativeDistance < threshold

            // Absolute overrides for safety:
            if (distance < 0.04) {
              isPinching = true
            } else if (distance > 0.18) {
              isPinching = false
            }
          }

          const next = { x: xPercent, y: yPercent, isTracking: true, landmarks: normalizedLandmarks, isPinching }
          const changed =
            !last.isTracking ||
            Math.abs(last.x - next.x) > 0.5 ||
            Math.abs(last.y - next.y) > 0.5

          if (changed) {
            lastCursorRef.current = next
            setCursor(next)
          }
        }
      } else {
      setCursor(prev => {
        if (!prev.isTracking) return prev
          const next = { ...prev, isTracking: false, landmarks: null, isPinching: false }
          lastCursorRef.current = next
          return next
        })
      }
    }

    let customCleanup: (() => void) | null = null

    const initializeMediaPipe = () => {
      try {
        if (!window.Hands) {
          console.log('MediaPipe Hands script not ready. Retrying in 500ms...')
          if (active) setTimeout(initializeMediaPipe, 500)
          return
        }

        hands = new window.Hands({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
          }
        })

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 0, // 0 = Lite (much faster on mobile/low-end devices)
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        })

        hands.onResults(onResults)

        if (videoRef.current) {
          let lastFrameTime = 0
          let frameId: number
          
          const processFrame = async () => {
            if (!active || !videoRef.current) return
            
            const now = performance.now()
            // Throttle to 25 FPS (approx 40ms) to save CPU/GPU resources
            if (now - lastFrameTime >= 40) {
              lastFrameTime = now
              try {
                await hands.send({ image: videoRef.current })
              } catch (sendErr) {
                // Catch frame processing errors silently
              }
            }
            
            if (active) {
              frameId = requestAnimationFrame(processFrame)
            }
          }
          
          const onPlay = () => {
            frameId = requestAnimationFrame(processFrame)
          }
          
          videoRef.current.addEventListener('play', onPlay)
          
          if (!videoRef.current.paused) {
            frameId = requestAnimationFrame(processFrame)
          }
          
          customCleanup = () => {
            if (videoRef.current) {
              videoRef.current.removeEventListener('play', onPlay)
            }
            cancelAnimationFrame(frameId)
          }
        }
      } catch (err) {
        console.error('Failed to initialize MediaPipe:', err)
      }
    }

    // Delay start slightly to allow webcam permissions and layout to settle
    const startupTimeout = setTimeout(initializeMediaPipe, 800)

    return () => {
      active = false
      clearTimeout(startupTimeout)
      if (customCleanup) {
        customCleanup()
      }
      if (hands) {
        try {
          hands.close()
        } catch (e) {}
      }
    }
  }, [videoRef, isActive])

  return cursor
}
