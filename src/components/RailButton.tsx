/* Facilitator control. Minimum 64px tap target per invariant 4, enforced in CSS
   rather than left to each call site. Full state set: default, hover,
   focus-visible, active, disabled. No hover-only affordance: hover only deepens
   a state that focus also reaches. */

import type { ReactNode } from 'react'

export function RailButton({
  children,
  onClick,
  variant = 'secondary',
  disabled = false,
  type = 'button',
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'quiet'
  disabled?: boolean
  type?: 'button' | 'submit'
}) {
  return (
    <button
      type={type}
      className={`btn btn--${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
