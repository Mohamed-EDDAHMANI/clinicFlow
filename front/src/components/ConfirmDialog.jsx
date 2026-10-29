import { LoaderCircle, Trash2 } from 'lucide-react'
import Modal from './Modal'

const ConfirmDialog = ({ open, title, children, confirmLabel, busy = false, onConfirm, onClose }) => {
  if (!open) return null

  return (
    <Modal title={title} onClose={onClose} busy={busy} small>
      <div className="md-body">
        <div className="flex items-start gap-3">
          <span className="danger-icn">
            <Trash2 aria-hidden="true" />
          </span>
          <div className="md-text flex-1">{children}</div>
        </div>
        <div className="md-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Garder
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? <LoaderCircle aria-hidden="true" className="spin" /> : <Trash2 aria-hidden="true" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
