import { APPOINTMENT_STATUS } from '../config/appointments'

const StatusChip = ({ status }) => {
  const meta = APPOINTMENT_STATUS[status]
  if (!meta) return null

  return (
    <span className={`chip ${meta.chip}`}>
      <span className="cdot" />
      {meta.label}
    </span>
  )
}

export default StatusChip
