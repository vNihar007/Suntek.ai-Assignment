import { CheckCircle, XCircle } from 'lucide-react'
import { createContext, useCallback, useContext, useRef, useState } from 'react'

interface ToastMessage { id: number; message: string; type: 'success' | 'error' }

const ToastContext = createContext<(msg: string, type?: 'success' | 'error') => void>(() => {})

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const counter = useRef(0)

  const toast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = ++counter.current
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium
              bg-[#1E293B] border-white/10 text-white min-w-[220px] animate-in slide-in-from-bottom-2 duration-200"
          >
            {t.type === 'success'
              ? <CheckCircle size={16} className="text-[#10B981] shrink-0" />
              : <XCircle size={16} className="text-[#DC2626] shrink-0" />
            }
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export default function Toast() { return null }
