import type { ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-blue-700 text-white hover:bg-blue-800 active:bg-blue-900 disabled:bg-blue-300',
  secondary: 'bg-white text-slate-900 border-2 border-slate-300 hover:bg-slate-50 active:bg-slate-100 disabled:text-slate-400',
  danger: 'bg-red-700 text-white hover:bg-red-800 active:bg-red-900 disabled:bg-red-300',
  ghost: 'text-slate-700 hover:bg-slate-100 active:bg-slate-200',
}

// 48px tall: comfortably above the 44px minimum for gloved hands
export function buttonClass(variant: Variant = 'secondary', extra = '') {
  return `inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-base font-semibold
    transition-colors disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-4
    focus-visible:outline-blue-400 ${VARIANTS[variant]} ${extra}`
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }

export function Button({ variant = 'secondary', className = '', type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, className)} {...rest} />
}

export function ButtonLink({ variant = 'secondary', className = '', ...rest }: LinkProps & { variant?: Variant }) {
  return <Link className={buttonClass(variant, className)} {...rest} />
}
