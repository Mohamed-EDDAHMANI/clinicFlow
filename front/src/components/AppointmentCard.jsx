import { APPOINTMENT_STATUS, reasonIcon } from '../config/appointments'
import { initials } from '../utils/format'
import Icon from './Icon'
import StatusBadge from './StatusBadge'

const AppointmentCard = ({ appointment, onStatusChange, busy }) => {
  const meta = APPOINTMENT_STATUS[appointment.status]

  return (
    <article className="relative flex flex-col gap-2 overflow-hidden rounded-xl bg-surface-container-lowest p-4 shadow-sm transition-shadow hover:shadow-md">
      <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${meta.bar}`} />
      <div className="flex items-start justify-between gap-2 pl-1">
        <div className="flex min-w-0 items-center gap-2">
          <span aria-hidden="true" className={`flex size-10 shrink-0 items-center justify-center rounded-full text-label-lg ${meta.avatar}`}>
            {initials(appointment.patient_name)}
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-label-lg font-semibold">{appointment.patient_name}</span>
            <span className="truncate text-body-sm text-on-surface-variant">CIN : {appointment.patient_cin}</span>
          </div>
        </div>
        <StatusBadge status={appointment.status} />
      </div>

      <div className="flex items-center justify-between gap-2 pt-1 pl-1 text-on-surface-variant">
        <span className="flex min-w-0 items-center gap-1 text-body-sm">
          <Icon name={reasonIcon(appointment.reason)} className="shrink-0 text-[16px]" />
          <span className="truncate">{appointment.reason}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1 rounded bg-surface-container-low px-2 py-0.5 text-label-md font-semibold text-on-surface tabular-nums">
          <Icon name="schedule" className="text-[14px] text-primary" />
          <time dateTime={appointment.appointment_date}>{appointment.local_time}</time>
        </span>
      </div>

      {appointment.notes && (
        <p className="flex items-start gap-1 pl-1 text-body-sm text-on-surface-variant">
          <Icon name="notes" className="mt-px shrink-0 text-[16px]" />
          <span className="line-clamp-2">{appointment.notes}</span>
        </p>
      )}

      {appointment.status === 'pending' && (
        <div className="mt-1 grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => onStatusChange(appointment, 'confirmed')}
            disabled={busy}
            className="flex h-10 items-center justify-center gap-1 rounded-lg bg-secondary text-label-md font-semibold text-on-secondary shadow-sm hover:opacity-95 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
          >
            <Icon name="check" className="text-[16px]" />
            Confirmer
          </button>
          <button
            type="button"
            onClick={() => onStatusChange(appointment, 'cancelled')}
            disabled={busy}
            className="flex h-10 items-center justify-center gap-1 rounded-lg bg-surface-container text-label-md font-semibold text-error hover:bg-error-container hover:text-on-error-container active:scale-[0.98] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error"
          >
            <Icon name="close" className="text-[16px]" />
            Annuler
          </button>
        </div>
      )}
    </article>
  )
}

export default AppointmentCard
