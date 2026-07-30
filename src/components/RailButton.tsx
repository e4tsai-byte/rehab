/* Facilitator control. Minimum 64px tap target per invariant 4, enforced in CSS
   rather than left to each call site. Full state set: default, hover,
   focus-visible, active, disabled. No hover-only affordance: hover only deepens
   a state that focus also reaches.

   The optional icon is a VERB marker — it says what the control will do, which
   is the only reason an icon is allowed to exist here. It is `aria-hidden`, so
   the label is always the accessible name and the icon can never be the sole
   carrier of meaning. A button with an icon and no label is not reachable
   through this component, deliberately. */

import type { ReactNode } from 'react'
import { Icon, type IconKind } from './Icon'

export function RailButton({
  children,
  onClick,
  variant = 'secondary',
  disabled = false,
  type = 'button',
  icon,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'quiet'
  disabled?: boolean
  type?: 'button' | 'submit'
  icon?: IconKind
}) {
  return (
    <button
      type={type}
      className={`btn btn--${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <Icon kind={icon} />}
      <span>{children}</span>
    </button>
  )
}
