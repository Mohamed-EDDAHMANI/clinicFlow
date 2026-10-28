import { useEffect, useRef } from 'react'
import Icon from './Icon'

const ConfirmDialog = ({ open, title, children, confirmLabel, busy = false, onConfirm, onClose }) => {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const handleCancel = (event) => {
    if (busy) event.preventDefault()
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={handleCancel}
      aria-labelledby="confirm-title"
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl bg-transparent p-0 shadow-xl backdrop:bg-on-surface/40 backdrop:backdrop-blur-sm"
    >
      {open && (
        <div className="flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-6">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-error-container text-on-error-container">
              <Icon name="delete" className="text-[22px]" />
            </span>
            <div className="flex flex-col gap-1">
              <h2 id="confirm-title" className="text-headline-sm font-semibold text-on-surface">{title}</h2>
              <div className="text-body-md text-on-surface-variant">{children}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              autoFocus
              className="flex h-11 items-center justify-center rounded-lg bg-surface-container px-4 text-label-lg font-semibold text-on-surface hover:bg-surface-container-high disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Garder
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className="flex h-11 items-center justify-center gap-1 rounded-lg bg-error px-4 text-label-lg font-semibold text-on-primary shadow-sm hover:opacity-95 disabled:cursor-wait disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error"
            >
              <Icon
                name={busy ? 'progress_activity' : 'delete'}
                className={`text-[20px] ${busy ? 'motion-safe:animate-spin' : ''}`}
              />
              {confirmLabel}
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}

export default ConfirmDialog
