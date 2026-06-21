import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onLoginEmail: (email: string, pass: string) => Promise<{ error?: string }>
  onSignUpEmail: (email: string, pass: string, name: string) => Promise<{ error?: string; successMessage?: string }>
  onLoginGoogle: () => void
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginEmail,
  onSignUpEmail,
  onLoginGoogle
}) => {
  const [isSignUp, setIsSignUp] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  if (!isOpen) return null

  const handleTabChange = (signUpMode: boolean) => {
    setIsSignUp(signUpMode)
    setError(null)
    setSuccess(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Form validations
    if (!email.trim() || !password.trim()) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }

    if (password.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร')
      return
    }

    if (isSignUp && !displayName.trim()) {
      setError('กรุณากรอกชื่อผู้เล่น')
      return
    }

    setLoading(true)

    try {
      if (isSignUp) {
        // Sign Up Flow
        const result = await onSignUpEmail(email.trim(), password, displayName.trim())
        if (result.error) {
          setError(result.error)
        } else {
          setSuccess(result.successMessage || 'สมัครสมาชิกสำเร็จ! โปรดเข้าสู่ระบบเพื่อเล่นเกม')
          // Auto switch to sign-in or clear fields
          setDisplayName('')
          setPassword('')
          setIsSignUp(false)
        }
      } else {
        // Sign In Flow
        const result = await onLoginEmail(email.trim(), password)
        if (result.error) {
          setError(result.error)
        } else {
          onClose() // Close on successful login
        }
      }
    } catch (err: any) {
      setError(err?.message || 'เกิดข้อผิดพลาดในการดำเนินการ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
        {/* Backdrop dismiss */}
        <div className="absolute inset-0 cursor-default" onClick={onClose} />
        
        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full relative shadow-2xl z-10 overflow-hidden"
        >
          {/* Decorative glows */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 rounded-full blur-xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/20 rounded-full blur-xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-all cursor-pointer select-none"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Tab Selection */}
          <div className="flex bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/40 mb-6">
            <button
              onClick={() => handleTabChange(false)}
              className={`flex-1 py-2 rounded-lg font-bold text-xs sm:text-sm tracking-wide transition-all cursor-pointer select-none ${
                !isSignUp
                  ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              เข้าสู่ระบบ
            </button>
            <button
              onClick={() => handleTabChange(true)}
              className={`flex-1 py-2 rounded-lg font-bold text-xs sm:text-sm tracking-wide transition-all cursor-pointer select-none ${
                isSignUp
                  ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              สมัครสมาชิก
            </button>
          </div>

          <h3 className="font-display font-black text-xl sm:text-2xl text-white text-center mb-6">
            {isSignUp ? 'สร้างบัญชีผู้เล่นใหม่' : 'เข้าสู่ระบบบัญชีของคุณ'}
          </h3>

          {/* Status Message Boxes */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-950/40 border border-red-900/30 rounded-xl p-3.5 text-red-400 text-xs flex items-start gap-2.5 mb-5 text-left"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-950/40 border border-emerald-900/30 rounded-xl p-3.5 text-emerald-400 text-xs flex items-start gap-2.5 mb-5 text-left"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {isSignUp && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  ชื่อผู้เล่น (Display Name)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                    <User className="w-4.5 h-4.5" />
                  </span>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="เช่น สมชาย ใจดี"
                    className="w-full bg-slate-950/50 border border-slate-800 focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl py-2.5 pl-10.5 pr-4 text-sm text-white placeholder-slate-650 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                อีเมล (Email)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                  <Mail className="w-4.5 h-4.5" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-950/50 border border-slate-800 focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl py-2.5 pl-10.5 pr-4 text-sm text-white placeholder-slate-650 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                รหัสผ่าน (Password)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                  <Lock className="w-4.5 h-4.5" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/50 border border-slate-800 focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl py-2.5 pl-10.5 pr-10.5 text-sm text-white placeholder-slate-650 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-white transition-colors cursor-pointer select-none"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-primary via-blue-600 to-secondary text-white font-bold text-sm rounded-xl hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shadow-lg shadow-primary/10 flex items-center justify-center gap-2 select-none"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isSignUp ? (
                'สมัครสมาชิกใหม่'
              ) : (
                'เข้าสู่ระบบ'
              )}
            </button>
          </form>

          {/* Separator */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-[1px] bg-slate-800" />
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">หรือ</span>
            <div className="flex-1 h-[1px] bg-slate-800" />
          </div>

          {/* Google Sign In */}
          <button
            onClick={onLoginGoogle}
            className="w-full py-2.5 bg-white text-slate-950 hover:bg-slate-100 font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shadow-md select-none"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>เข้าสู่ระบบด้วย Google</span>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
