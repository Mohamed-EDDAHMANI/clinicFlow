import { Check, LoaderCircle, UserRound, X } from 'lucide-react'
import { useAppointmentStatus } from '../hooks/useAppointmentStatus'
import { useOverlay } from '../hooks/useOverlay'
import { formatLongDate, formatTimestamp } from '../utils/format'
import Modal from './Modal'
import StatusChip from './StatusChip'

const AppointmentDetailModal = ({ appointment, onClose }) => {
  const { openPatient } = useOverlay()
  const { busyIds, changeStatus } = useAppointmentStatus(onClose)
  const busy = busyIds.has(appointment.id)
  const canConfirm = appointment.status === 'pending'
  const canCancel = appointment.status !== 'cancelled'

  const showPatient = () => {
    onClose()
    openPatient(appointment.patient_id)
  }

  return (
    <Modal title="Détails du rendez-vous" onClose={onClose} busy={busy}>
      <div className="md-body">
        <div className="detail-lines">
          <div className="dl">
            <span>Patient</span>
            <b>
              <button type="button" className="link-btn p-0!" onClick={showPatient}>
                {appointment.patient_name}
              </button>
            </b>
          </div>
          <div className="dl"><span>CIN</span><b className="num">{appointment.patient_cin}</b></div>
          <div className="dl"><span>Date</span><b>{formatLongDate(appointment.local_date)} · {appointment.local_time}</b></div>
          <div className="dl"><span>Motif</span><b>{appointment.reason}</b></div>
          {appointment.notes && <div className="dl"><span>Notes</span><b>{appointment.notes}</b></div>}
          <div className="dl"><span>Statut</span><b><StatusChip status={appointment.status} /></b></div>
          <div className="dl"><span>Créé le</span><b>{formatTimestamp(appointment.created_at)}</b></div>
        </div>

        <div className="md-foot">
          <button type="button" className="btn btn-ghost mr-auto" onClick={showPatient}>
            <UserRound aria-hidden="true" />
            Fiche patient
          </button>
          {canCancel && (
            <button type="button" className="btn btn-danger-ghost" onClick={() => changeStatus(appointment, 'cancelled')} disabled={busy}>
              {busy ? <LoaderCircle aria-hidden="true" className="spin" /> : <X aria-hidden="true" />}
              Annuler le RDV
            </button>
          )}
          {canConfirm && (
            <button type="button" className="btn btn-primary" onClick={() => changeStatus(appointment, 'confirmed')} disabled={busy}>
              {busy ? <LoaderCircle aria-hidden="true" className="spin" /> : <Check aria-hidden="true" />}
              Confirmer
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default AppointmentDetailModal
