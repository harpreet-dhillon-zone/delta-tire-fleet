import { useCallback } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

// Panels on a page (tire details, forms) live in the query string, e.g.
// ?tire=12 or ?tire=12&action=move, so the phone's back button closes them.
export function usePanelParams() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()

  const open = useCallback(
    (next: Record<string, string>) => {
      const sp = new URLSearchParams()
      for (const [k, v] of Object.entries(next)) sp.set(k, v)
      const opened = (location.state as { panel?: number } | null)?.panel ?? 0
      navigate({ search: `?${sp}` }, { state: { panel: opened + 1 } })
    },
    [navigate, location.state],
  )

  const close = useCallback(() => {
    // Opened from this page: step back. Arrived by link with the panel open: just drop it.
    if ((location.state as { panel?: number } | null)?.panel) navigate(-1)
    else navigate({ search: '' }, { replace: true })
  }, [navigate, location.state])

  // Close every panel, e.g. after a move when the tire has left this unit
  const reset = useCallback(() => navigate({ search: '' }, { replace: true }), [navigate])

  return { params, open, close, reset }
}
