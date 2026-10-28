import { useCallback } from 'react'
import { Link, useSearchParams } from 'react-router'
import { getAppointments } from '../api/appointmentService'
import { useApi } from '../hooks/useApi'
import { useAppointmentStatus } from '../hooks/useAppointmentStatus'
import { APPOINTMENT_STATUS } from '../config/appointments'
import { formatLongDate, localToday, plural } from '../utils/format'
import Icon from '../components/Icon'
import Alert from '../components/Alert'
import AppointmentCard from '../components/AppointmentCard'

const STATUS_FILTERS = [
  { value: '', label: 'Tous' },
  ...Object.entries(APPOINTMENT_STATUS).map(([value, meta]) => ({ value, label: meta.plural })),
]

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const groupByDay = (appointments) =>
  appointments.reduce((groups, appointment) => {
    const last = groups.at(-1)
    if (last?.date === appointment.local_date) last.items.push(appointment)
    else groups.push({ date: appointment.local_date, items: [appointment] })
    return groups
  }, [])

const chipClass = (active) =>
  'flex h-9 shrink-0 items-center gap-1 rounded-full px-3 text-label-md font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ' +
  (active ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface')

const Placeholder = ({ className = '' }) => (
  <span aria-hidden="true" className={`block rounded bg-surface-container ${className}`} />
)

const ListSkeleton = () => (
  <div aria-hidden="true" className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
    {[0, 1, 2].map((item) => (
      <div key={item} className="flex flex-col gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Placeholder className="size-10 rounded-full" />
          <div className="flex flex-col gap-1">
            <Placeholder className="h-4 w-32" />
            <Placeholder className="h-3 w-24" />
          </div>
        </div>
        <Placeholder className="h-4 w-full" />
      </div>
    ))}
  </div>
)

const EmptyState = ({ filtered, onReset }) => (
  <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-outline-variant px-4 py-10 text-center">
    <span className="flex size-12 items-center justify-center rounded-xl bg-surface-container-high text-primary">
      <Icon name={filtered ? 'event_busy' : 'calendar_add_on'} className="text-[26px]" />
    </span>
    <p className="text-label-lg font-semibold">
      {filtered ? 'Aucun rendez-vous pour ces filtres' : 'Aucun rendez-vous planifié'}
    </p>
    <p className="max-w-sm text-body-md text-on-surface-variant">
      {filtered
        ? 'Changez la date ou le statut, ou affichez tous les rendez-vous.'
        : 'Planifiez un premier rendez-vous pour un patient enregistré.'}
    </p>
    {filtered && (
      <button
        type="button"
        onClick={onReset}
        className="mt-1 flex h-10 items-center gap-1 rounded-lg px-3 text-label-lg font-semibold text-primary hover:bg-surface-container-low focus-visible:outline-2 focus-visible:outline-primary"
      >
        <Icon name="filter_alt_off" className="text-[18px]" />
        Effacer les filtres
      </button>
    )}
  </div>
)

const AppointmentsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const dateParam = searchParams.get('date') ?? ''
  const date = DATE_PATTERN.test(dateParam) ? dateParam : ''
  const statusParam = searchParams.get('status') ?? ''
  const status = APPOINTMENT_STATUS[statusParam] ? statusParam : ''
  const today = localToday()

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

  const fetchAppointments = useCallback(() => getAppointments({ date, status }), [date, status])
  const { data: appointments, error, loading, reload, setData } = useApi(fetchAppointments)

  const { busyIds, changeStatus } = useAppointmentStatus((updated) =>
    setData((list) => list.map((item) => (item.id === updated.id ? updated : item))),
  )

  const filtered = Boolean(date || status)
  const groups = appointments ? groupByDay(appointments) : []

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <section aria-labelledby="appointments-title" className="flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-4 shadow-sm lg:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 id="appointments-title" className="text-headline-sm font-semibold lg:text-headline-md">Planning des rendez-vous</h1>
            <p className="text-body-sm text-on-surface-variant lg:text-body-md">
              {appointments
                ? `${plural(appointments.length, 'rendez-vous', 'rendez-vous')}${date ? ` le ${formatLongDate(date).toLowerCase()}` : ''}`
                : 'Filtrez par date ou par statut.'}
            </p>
          </div>
          <Link
            to="/appointments/new"
            className="flex h-11 items-center justify-center gap-1 whitespace-nowrap rounded-lg bg-primary px-4 text-label-lg font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-container active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Icon name="add_circle" className="text-[20px]" />
            Nouveau RDV
          </Link>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-date" className="text-label-md font-medium">Date</label>
            <div className="flex items-center gap-2">
              <input
                id="filter-date"
                type="date"
                value={date}
                onChange={(event) => updateParams({ date: event.target.value })}
                className="h-11 min-w-0 flex-1 rounded-lg bg-surface-container-low px-3 text-body-md text-on-surface ring-1 ring-inset ring-outline-variant/50 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:outline-none sm:w-48 sm:flex-none"
              />
              <button type="button" onClick={() => updateParams({ date: today })} aria-pressed={date === today} className={chipClass(date === today)}>
                Aujourd'hui
              </button>
              {date && (
                <button
                  type="button"
                  onClick={() => updateParams({ date: '' })}
                  aria-label="Afficher toutes les dates"
                  title="Toutes les dates"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <Icon name="close" className="text-[18px]" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span id="filter-status" className="text-label-md font-medium">Statut</span>
            <div role="group" aria-labelledby="filter-status" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.value || 'all'}
                  type="button"
                  onClick={() => updateParams({ status: filter.value })}
                  aria-pressed={status === filter.value}
                  className={chipClass(status === filter.value)}
                >
                  {filter.value && <Icon name={APPOINTMENT_STATUS[filter.value].icon} className="text-[16px]" />}
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="flex flex-col gap-2">
          <Alert>{appointments ? `Actualisation impossible. ${error.message}` : error.message}</Alert>
          <button
            type="button"
            onClick={reload}
            className="flex h-10 items-center justify-center gap-1 self-start rounded-lg px-3 text-label-lg text-primary hover:bg-surface-container-low focus-visible:outline-2 focus-visible:outline-primary"
          >
            <Icon name="refresh" className="text-[18px]" />
            Réessayer
          </button>
        </div>
      )}

      {loading && !appointments && <ListSkeleton />}

      {appointments && appointments.length === 0 && !loading && (
        <EmptyState filtered={filtered} onReset={() => updateParams({ date: '', status: '' })} />
      )}

      {groups.length > 0 && (
        <div aria-busy={loading} className={`flex flex-col gap-6 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          {groups.map((group) => (
            <section key={group.date} aria-labelledby={`day-${group.date}`} className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-1">
                <h2 id={`day-${group.date}`} className="text-label-lg font-semibold lg:text-headline-sm">
                  {formatLongDate(group.date)}
                  {group.date.slice(0, 4) !== today.slice(0, 4) && ` ${group.date.slice(0, 4)}`}
                </h2>
                {group.date === today && (
                  <span className="rounded-full bg-primary-fixed px-2 py-0.5 text-label-sm text-on-primary-fixed">Aujourd'hui</span>
                )}
                <span className="rounded-full bg-surface-variant px-2 py-0.5 text-label-sm text-on-surface-variant">
                  {plural(group.items.length, 'RDV', 'RDV')}
                </span>
              </div>
              <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {group.items.map((appointment) => (
                  <li key={appointment.id}>
                    <AppointmentCard appointment={appointment} onStatusChange={changeStatus} busy={busyIds.has(appointment.id)} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

export default AppointmentsPage
