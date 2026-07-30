/* Facilitator control. Minimum 64px tap target per invariant 4, enforced in CSS
   rather than left to each call site. Full state set: default, hover,
   focus-visible, active, disabled. No hover-only affordance: hover only deepens
   a state that focus also reaches.

   The optional icon is a VERB marker — it says what the control will do, which
   is the only reason an icon is allowed to exist here. It is `aria-hidden`, so
   the label is always the accessible name and the icon can never be the sole
   carrier of meaning. A button with an icon and no label is not reachable
   through this component, deliberately.

   `ariaLabel` OVERRIDES the accessible name without changing the visible text.
   It exists for repeated controls in a list: twelve roster rows carrying the
   same two verbs give a screen-reader user twelve buttons called 查看紀錄 with
   nothing to tell them apart, because the participant's name is in the row and
   not in the button. The visible label stays short — a sighted facilitator
   already has the row for context — while the accessible name carries who it
   acts on. Use it only to ADD context, never to replace the visible words with
   different ones. */

import type { ReactNode } from 'react'
import { Icon, type IconKind } from './Icon'

export function RailButton({
  children,
  onClick,
  variant = 'secondary',
  disabled = false,
  type = 'button',
  icon,
  ariaLabel,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'quiet'
  disabled?: boolean
  type?: 'button' | 'submit'
  icon?: IconKind
  /** Adds context to the accessible name. Must still contain the visible text. */
  ariaLabel?: string
}) {
  return (
    <button
      type={type}
      className={`btn btn--${variant}`}
      onClick={onClick}
      disabled={disabled}
      {...(ariaLabel ? { 'aria-label': ariaLabel } : {})}
    >
      {icon && <Icon kind={icon} />}
      <span>{children}</span>
    </button>
  )
}
