import type { Status } from '../../lib/types'

// A distinct shape per status so it reads without color:
// octagon = critical, triangle = warning, dashed circle = no data, check = ok
export function StatusIcon({ status, className = 'h-5 w-5' }: { status: Status; className?: string }) {
  const common = { className, viewBox: '0 0 24 24', 'aria-hidden': true, fill: 'none', stroke: 'currentColor', strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
  switch (status) {
    case 'critical':
      return (
        <svg {...common}>
          <path d="M8 2h8l6 6v8l-6 6H8l-6-6V8z" />
          <path d="M12 7v6M12 17h.01" />
        </svg>
      )
    case 'warning':
      return (
        <svg {...common}>
          <path d="M12 3 2 21h20z" />
          <path d="M12 10v4M12 18h.01" />
        </svg>
      )
    case 'no_data':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
          <path d="M8 12h8" />
        </svg>
      )
    case 'ok':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12 3 3 5-6" />
        </svg>
      )
  }
}
