import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { getAppointments } from '../api/appointmentService'
import { APPOINTMENT_STATUS, APPOINTMENT_WINDOW_MINUTES } from '../config/appointments'
import { useApi } from '../hooks/useApi'
import { useOverlay } from '../hooks/useOverlay'
import {
  addDays,
  clinicNowMinutes,
  clinicToday,
  dayOfMonth,
  formatDateRange,
  formatLongDate,
  formatWeekday,
  isPast,
  plural,
  startOfWeek,
  toMinutes,
} from '../utils/format'
import Alert from '../components/Alert'
import AppointmentDetailModal from '../components/AppointmentDetailModal'

const SLOT_HEIGHT = 60
const DEFAULT_START_HOUR = 8
const DEFAULT_END_HOUR = 19
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const STATUS_FILTERS = [
  { value: '', label: 'Tous les statuts' },
  ...Object.entries(APPOINTMENT_STATUS).map(([value, meta]) => ({ value, label: meta.plural })),
]

const pad = (value) => String(value).padStart(2, '0')

const layoutDay = (events) => {
  const sorted = [...events].sort((a, b) => toMinutes(a.local_time) - toMinutes(b.local_time))
  const placed = []
  let cluster = []
  let clusterEnd = -1
  let laneEnds = []

  const flush = () => {
    cluster.forEach((item) => placed.push({ ...item, lanes: laneEnds.length }))
    cluster = []
    laneEnds = []
  }

  sorted.forEach((appointment) => {
    const start = toMinutes(appointment.local_time)
    const end = start + APPOINTMENT_WINDOW_MINUTES
    if (start >= clusterEnd) flush()
    let lane = laneEnds.findIndex((laneEnd) => laneEnd <= start)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(end)
    } else {
      laneEnds[lane] = end
    }
    clusterEnd = Math.max(clusterEnd, end)
    cluster.push({ appointment, start, lane })
  })
  flush()

  return placed
}

const AppointmentsPage = () => {
  const { open } = useOverlay()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selected, setSelected] = useState(null)
  const today = clinicToday()
  const dateParam = searchParams.get('date') ?? ''
  const anchor = DATE_PATTERN.test(dateParam) ? dateParam : today
  const statusParam = searchParams.get('status') ?? ''
  const status = APPOINTMENT_STATUS[statusParam] ? statusParam : ''

  const updateParams = (next) =>
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current)
        Object.entries(next).forEach(([key, value]) => {
          if (value) params.set(key, value)
          else params.delete(key)
        })
        return params
      },
      { replace: true },
    )

  const fetchAppointments = useCallback(() => getAppointments({ status }), [status])
  const { data, error, loading, reload } = useApi(fetchAppointments)

  const weekStart = startOfWeek(anchor)
  const weekEnd = addDays(weekStart, 6)
  const weekEvents = (data ?? []).filter((appointment) => appointment.local_date >= weekStart && appointment.local_date <= weekEnd)
  const hasSunday = weekEvents.some((appointment) => appointment.local_date === weekEnd)
  const days = Array.from({ length: hasSunday ? 7 : 6 }, (_, index) => addDays(weekStart, index))

  const minutes = weekEvents.map((appointment) => toMinutes(appointment.local_time))
  const startHour = Math.min(DEFAULT_START_HOUR, ...minutes.map((value) => Math.floor(value / 60)))
  const endHour = Math.max(DEFAULT_END_HOUR, ...minutes.map((value) => Math.ceil((value + APPOINTMENT_WINDOW_MINUTES) / 60)))
  const hours = Array.from({ length: endHour - startHour }, (_, index) => startHour + index)
  const nowMinutes = clinicNowMinutes()
  const nowTop = ((nowMinutes - startHour * 60) / 60) * SLOT_HEIGHT

  const goToWeek = (offset) => updateParams({ date: addDays(weekStart, offset * 7) })

  return (
    <>
      <div className="page-head stagger">
        <div>
          <div className="eyebrow">Agenda partagé</div>
          <h1 className="page-title">Rendez-vous</h1>
          <p className="page-sub">
            {data
              ? `${plural(weekEvents.length, 'rendez-vous', 'rendez-vous')} cette semaine${status ? ` · ${APPOINTMENT_STATUS[status].plural.toLowerCase()}` : ''}`
              : 'Planifiez et suivez les consultations de la clinique.'}
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary" onClick={() => open('new-appointment')}>
            <Plus aria-hidden="true" />
            Nouveau rendez-vous
          </button>
        </div>
      </div>

      <div className="cal-controls stagger">
        <div className="week-nav">
          <button type="button" className="icon-btn sm" onClick={() => goToWeek(-1)} aria-label="Semaine précédente">
            <ChevronLeft aria-hidden="true" />
          </button>
          <b aria-live="polite">{formatDateRange(weekStart, addDays(weekStart, days.length - 1))}</b>
          <button type="button" className="icon-btn sm" onClick={() => goToWeek(1)} aria-label="Semaine suivante">
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
        <button type="button" className="btn btn-outline" onClick={() => updateParams({ date: '' })} disabled={weekStart === startOfWeek(today)}>
          Aujourd'hui
        </button>
        <label htmlFor="cal-date" className="sr-only">Aller à la date</label>
        <input id="cal-date" type="date" className="input compact" value={anchor} onChange={(event) => updateParams({ date: event.target.value })} />
        <label htmlFor="cal-status" className="sr-only">Filtrer par statut</label>
        <select id="cal-status" className="input compact" value={status} onChange={(event) => updateParams({ status: event.target.value })}>
          {STATUS_FILTERS.map((filter) => (
            <option key={filter.value || 'all'} value={filter.value}>{filter.label}</option>
          ))}
        </select>
        <div className="legend" aria-hidden="true">
          {Object.values(APPOINTMENT_STATUS).map((meta) => (
            <span key={meta.label}><i style={{ background: meta.dot }} />{meta.label}</span>
          ))}
        </div>
      </div>

      {error && (
        <Alert className="mb-4" action={<button type="button" className="link-btn" onClick={reload}>Réessayer</button>}>
          {data ? `Actualisation impossible. ${error.message}` : error.message}
        </Alert>
      )}

      <div className="card cal-card page-fill stagger">
        <div className="cal">
          <div className={`cal-inner ${loading ? 'loading' : ''}`} aria-busy={loading} style={{ '--slot': `${SLOT_HEIGHT}px` }}>
            <div className="cal-grid" style={{ '--days': days.length }}>
              <div className="cal-head"><small>Heure</small></div>
              {days.map((day) => {
                const count = weekEvents.filter((appointment) => appointment.local_date === day).length
                return (
                  <div key={day} className={`cal-head ${day === today ? 'is-today' : ''}`}>
                    <small>{formatWeekday(day)}</small>
                    <b>{dayOfMonth(day)}</b>
                    <span className="count">{count ? plural(count, 'RDV', 'RDV') : '—'}</span>
                  </div>
                )
              })}

              <div className="cal-time" aria-hidden="true">
                {hours.map((hour) => <span key={hour}>{pad(hour)}:00</span>)}
              </div>

              {days.map((day) => {
                const events = layoutDay(weekEvents.filter((appointment) => appointment.local_date === day))
                return (
                  <div key={day} className={`cal-day ${day === today ? 'is-today' : ''}`}>
                    {hours.map((hour) => {
                      const time = `${pad(hour)}:00`
                      const past = isPast(day, `${pad(hour)}:59`)
                      return past ? (
                        <div key={hour} className="cal-slot past" />
                      ) : (
                        <button
                          key={hour}
                          type="button"
                          className="cal-slot"
                          onClick={() => open('new-appointment', { date: day, time })}
                          aria-label={`Planifier un rendez-vous le ${formatLongDate(day).toLowerCase()} à ${time}`}
                        />
                      )
                    })}

                    {day === today && nowTop >= 0 && nowTop <= hours.length * SLOT_HEIGHT && (
                      <div className="now-line" style={{ top: nowTop }} />
                    )}

                    {events.map(({ appointment, start, lane, lanes }) => (
                      <button
                        key={appointment.id}
                        type="button"
                        className={`cal-event ${APPOINTMENT_STATUS[appointment.status].event}`}
                        style={{
                          top: ((start - startHour * 60) / 60) * SLOT_HEIGHT + 2,
                          height: (APPOINTMENT_WINDOW_MINUTES / 60) * SLOT_HEIGHT - 4,
                          left: `calc(${(lane / lanes) * 100}% + 4px)`,
                          width: `calc(${100 / lanes}% - 8px)`,
                        }}
                        onClick={() => setSelected(appointment)}
                        title={`${appointment.local_time} · ${appointment.patient_name} · ${appointment.reason}`}
                      >
                        <b>{appointment.local_time} · {appointment.patient_name}</b>
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {selected && <AppointmentDetailModal appointment={selected} onClose={() => setSelected(null)} />}
    </>
  )
}

export default AppointmentsPage
