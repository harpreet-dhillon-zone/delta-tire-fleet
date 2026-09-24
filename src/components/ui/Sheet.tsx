import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

type SheetProps = {
  title: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

// Bottom sheet on phones, side panel on larger screens
export function Sheet({ title, onClose, children, footer }: SheetProps) {
  const panel = useRef<HTMLDivElement>(null)
  // Kept in a ref so a new onClose each render doesn't re-run the effect and steal focus
  const close = useRef(onClose)
  close.current = onClose

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close.current()
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panel.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [])

  // Portal to <body> so parent spacing/transforms can't offset the overlay
  return createPortal(
    <div className="fixed inset-0 z-40 flex items-end">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className="relative flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-xl outline-none
          md:absolute md:inset-y-0 md:right-0 md:max-h-none md:w-[28rem] md:rounded-none"
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 py-2 pl-4 pr-2">
          <h2 className="min-w-0 truncate text-xl font-bold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">{children}</div>
        {footer && <div className="border-t border-slate-200 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
