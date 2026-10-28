import { APPOINTMENT_STATUS } from '../config/appointments'
import Icon from './Icon'

const StatusBadge = ({ status }) => {
  const meta = APPOINTMENT_STATUS[status]
  if (!meta) return null

  return (
    <span className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-label-sm font-semibold ${meta.badge}`}>
      <Icon name={meta.icon} filled={meta.filled} className="text-[13px]" />
      {meta.label}
    </span>
  )
}

export default StatusBadge
