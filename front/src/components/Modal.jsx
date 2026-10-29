import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { GripHorizontal, X } from 'lucide-react'

const FOCUSABLE = 'input:not([type="hidden"]):not([tabindex="-1"]), select, textarea, button:not([data-close])'
const SHEET_QUERY = '(max-width: 640px)'
const CENTER = { x: 0, y: 0 }

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const Modal = ({ title, onClose, busy = false, small = false, wide = false, children }) => {
  const titleId = useId()
  const dialogRef = useRef(null)
  const closeRef = useRef(onClose)
  const dragRef = useRef(null)
  const [offset, setOffset] = useState(CENTER)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    const previous = document.activeElement
    dialogRef.current?.querySelector(FOCUSABLE)?.focus()
    return () => previous?.focus?.()
  }, [])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !busy) closeRef.current()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [busy])

  useEffect(() => {
    const onResize = () => setOffset(CENTER)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const startDrag = (event) => {
    if (event.button !== 0 || event.target.closest('button') || window.matchMedia(SHEET_QUERY).matches) return

    const rect = dialogRef.current.getBoundingClientRect()
    dragRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      minX: offset.x - rect.left,
      maxX: offset.x + window.innerWidth - rect.right,
      minY: offset.y - rect.top,
      maxY: offset.y + window.innerHeight - rect.bottom,
      startX: offset.x,
      startY: offset.y,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragging(true)
  }

  const moveDrag = (event) => {
    const drag = dragRef.current
    if (!drag) return

    setOffset({
      x: clamp(drag.startX + event.clientX - drag.pointerX, drag.minX, drag.maxX),
      y: clamp(drag.startY + event.clientY - drag.pointerY, Math.min(drag.minY, 0), Math.max(drag.maxY, 0)),
    })
  }

  const endDrag = () => {
    dragRef.current = null
    setDragging(false)
  }

  return createPortal(
    <div className="modal-wrap">
      <div className="modal-backdrop" onClick={() => !busy && onClose()} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`modal ${small ? 'sm' : ''} ${wide ? 'wide' : ''} ${dragging ? 'dragging' : ''}`}
        style={{ translate: `${offset.x}px ${offset.y}px` }}
      >
        <div
          className="md-head"
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onDoubleClick={(event) => !event.target.closest('button') && setOffset(CENTER)}
          title="Glisser pour déplacer · double-clic pour recentrer"
        >
          <GripHorizontal aria-hidden="true" className="md-grip" />
          <h3 id={titleId}>{title}</h3>
          <button type="button" data-close className="icon-btn" onClick={onClose} disabled={busy} aria-label="Fermer">
            <X aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}

export default Modal
