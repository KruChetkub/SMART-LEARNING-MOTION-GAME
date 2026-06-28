import React, { useState, useEffect } from 'react'
import { Download, Share, PlusSquare, X, Smartphone } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export const PWAInstallPrompt: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showIOSGuide, setShowIOSGuide] = useState(false)

  useEffect(() => {
    // Check if already in standalone (installed) mode
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true

    if (isStandalone) {
      return // Already installed, do nothing
    }

    // Check if user previously dismissed prompt
    const dismissedTime = localStorage.getItem('pwa-prompt-dismissed')
    if (dismissedTime) {
      const now = new Date().getTime()
      const diffDays = (now - parseInt(dismissedTime, 10)) / (1000 * 60 * 60 * 24)
      if (diffDays < 7) {
        return // Don't show if dismissed within 7 days
      }
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const ios = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(ios)

    if (ios) {
      // iOS Safari doesn't trigger beforeinstallprompt, so we display the guide banner
      // only if it's not in standalone mode
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 3000) // Show after 3 seconds
      return () => clearTimeout(timer)
    }

    // Listen for beforeinstallprompt event (Android / Desktop Chrome / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('pwa-prompt-dismissed', new Date().getTime().toString())
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true)
      return
    }

    if (!deferredPrompt) return

    // Show native install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice
    console.log(`[PWA] Install prompt outcome: ${outcome}`)

    // Clear deferred prompt
    setDeferredPrompt(null)
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <div className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="glass-panel p-5 rounded-2xl border-slate-700/50 shadow-2xl relative bg-slate-900/90 backdrop-blur-xl text-left"
        >
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="ปิดการแจ้งเตือน"
          >
            <X className="w-4 h-4" />
          </button>

          {!showIOSGuide ? (
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0 pr-4">
                <h4 className="font-display font-black text-sm text-white leading-tight mb-1 flex items-center gap-1.5">
                  ติดตั้งแอปพลิเคชัน 🚀
                </h4>
                <p className="text-[11px] text-slate-400 leading-snug mb-3">
                  เพิ่มเกมคณิตศาสตร์ลงในอุปกรณ์ของคุณ เพื่อการเล่นที่ลื่นไหล เต็มจอ และสะดวกยิ่งขึ้น!
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleInstallClick}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-gradient-to-r from-secondary to-accent hover:from-secondary/90 hover:to-accent/90 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-secondary/10 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    ติดตั้งทันที
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-350 hover:text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    ไว้ทีหลัง
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // iOS installation guide instructions
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-3"
            >
              <h4 className="font-display font-black text-sm text-white leading-tight flex items-center gap-1.5">
                ติดตั้งบน iOS / Safari 📲
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                ทำตาม 2 ขั้นตอนนี้เพื่อเพิ่มเกมคณิตศาสตร์ไปยังหน้าจอโฮมของคุณ:
              </p>
              <div className="space-y-2 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                <div className="flex items-start gap-2.5 text-xs text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[10px] shrink-0">1</div>
                  <p className="text-[11px] leading-snug pt-0.5">
                    กดปุ่ม <span className="inline-flex items-center bg-slate-800 px-1.5 py-0.5 rounded text-white font-bold text-[10px] gap-1"><Share className="w-3 h-3 text-secondary" /> แชร์ (Share)</span> ที่แถบเมนูด้านล่างของ Safari
                  </p>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[10px] shrink-0">2</div>
                  <p className="text-[11px] leading-snug pt-0.5">
                    เลือกเมนู <span className="inline-flex items-center bg-slate-800 px-1.5 py-0.5 rounded text-white font-bold text-[10px] gap-1"><PlusSquare className="w-3 h-3 text-accent" /> เพิ่มไปยังหน้าจอโฮม (Add to Home Screen)</span>
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-1">
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  ย้อนกลับ
                </button>
                <button
                  onClick={handleDismiss}
                  className="py-1.5 px-3 rounded-lg bg-secondary text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  รับทราบ
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
