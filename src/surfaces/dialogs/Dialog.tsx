/* Native <dialog>. Chosen over a hand-rolled overlay so focus trapping, Esc, and
   escaping the stacking context come from the platform rather than from code we
   would have to keep correct. */

import { useEffect, useRef, type ReactNode } from 'react'

export function Dialog({
  open,
  onCancel,
  labelledBy,
  children,
}: {
  open: boolean
  onCancel: () => void
  labelledBy: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="dlg no-print"
      aria-labelledby={labelledBy}
      onCancel={(e) => {
        e.preventDefault()
        onCancel()
      }}
    >
      {children}
    </dialog>
  )
}
