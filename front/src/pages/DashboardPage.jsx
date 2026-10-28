import { useCallback, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router'
import { getDashboardStats } from '../api/dashboardService'
import { getAppointments, updateAppointmentStatus } from '../api/appointmentService'
import { useApi } from '../hooks/useApi'
import { useNotify } from '../hooks/useNotify'
import { APPOINTMENT_STATUS, reasonIcon } from '../config/appointments'
import { firstName, formatClockTime, formatCount, formatLongDate, initials, plural } from '../utils/format'
import Icon from '../components/Icon'
import Alert from '../components/Alert'
import StatusBadge from '../components/StatusBadge'

const Placeholder = ({ className = '' }) => (
  <span aria-hidden="true" className={`block rounded bg-surface-container ${className}`} />
)

const BlockError = ({ message, onRetry }) => (
  <div className="flex flex-col gap-2">
    <Alert>{message}</Alert>
    <button
      type="button"
      onClick={onRetry}
      className="flex h-10 items-center justify-center gap-1 self-start rounded-lg px-3 text-label-lg text-primary hover:bg-surface-container-low focus-visible:outline-2 focus-visible:outline-primary"
    >
      <Icon name="refresh" className="text-[18px]" />
      Réessayer
    </button>
  </div>
)

const StaleNotice = ({ updatedAt }) => (
  <Alert>
    Actualisation impossible. {updatedAt ? `Les données affichées datent de ${formatClockTime(updatedAt)}.` : ''}
  </Alert>
)

const daySummary = (appointments) => {
  if (!appointments) return null
  const planned = appointments.filter((appointment) => appointment.status !== 'cancelled')
  const pending = planned.filter((appointment) => appointment.status === 'pending').length

  if (!planned.length) return "Aucune consultation n'est planifiée aujourd'hui."
  const base = `Votre journée compte ${plural(planned.length, 'consultation planifiée', 'consultations planifiées')}`
  return pending ? `${base} avec ${plural(pending, 'dossier', 'dossiers')} à valider.` : `${base}, toutes confirmées.`
}

const QuickAction = ({ to, icon, label, primary = false }) => (
  <Link
    to={to}
    className={
      'flex h-11 min-w-0 items-center justify-center gap-1 whitespace-nowrap rounded-lg px-2 text-label-lg font-semibold shadow-sm sm:px-4 transition-all active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ' +
      (primary
        ? 'bg-primary text-on-primary hover:bg-primary-container'
        : 'bg-surface-container-low text-on-surface hover:bg-surface-container')
    }
  >
    <Icon name={icon} className={`text-[20px] ${primary ? '' : 'text-primary'}`} />
    {label}
  </Link>
)

const GreetingCard = ({ user, today, appointments, loading }) => (
  <section aria-labelledby="dashboard-title" className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-4 shadow-sm lg:p-8">
    <span aria-hidden="true" className="pointer-events-none absolute -right-6 -bottom-6 size-28 rounded-full bg-primary-fixed/20 lg:-right-12 lg:-bottom-12 lg:size-48" />

    <div className="relative flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        {today ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-fixed px-2 py-0.5 text-label-sm text-on-primary-fixed">
            <Icon name="calendar_today" className="text-[14px]" />
            {formatLongDate(today)}
          </span>
        ) : (
          loading && <Placeholder className="h-[18px] w-32 rounded-full" />
        )}
        <span className="flex items-center gap-1 text-label-sm font-semibold text-secondary">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-secondary" />
          Clinique ouverte
        </span>
      </div>

      <h1 id="dashboard-title" className="mt-1 text-headline-lg-mobile font-semibold lg:text-headline-xl lg:font-bold">
        Bonjour, {firstName(user?.full_name)}
      </h1>
      {appointments ? (
        <p className="text-body-sm text-on-surface-variant lg:text-body-lg">{daySummary(appointments)}</p>
      ) : (
        loading && <Placeholder className="mt-1 h-[18px] w-64 max-w-full" />
      )}
    </div>

    <div className="relative mt-4 grid max-w-xl grid-cols-2 gap-2 lg:mt-6">
      <QuickAction to="/appointments/new" icon="add_circle" label="Nouveau RDV" primary />
      <QuickAction to="/patients/new" icon="person_add" label="Ajouter patient" />
    </div>
  </section>
)

const RuleBanner = () => (
  <aside className="flex items-center gap-2 rounded-xl bg-surface-container-low px-4 py-2 shadow-sm">
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary-container">
      <Icon name="verified" className="text-[20px] text-on-secondary-container" />
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-label-lg font-semibold">Contrôle des créneaux actifs</p>
      <p className="text-body-sm text-on-surface-variant">
        Deux rendez-vous confirmés d'un même patient ne peuvent pas se chevaucher sur 30 minutes.
      </p>
    </div>
    <Icon name="check_circle" className="shrink-0 text-[20px] text-secondary" />
  </aside>
)

const MainStat = ({ label, icon, iconClass, value, caption }) => (
  <div className="flex flex-col rounded-xl bg-surface-container-lowest p-4 shadow-sm transition-shadow hover:shadow-md">
    <div className="flex min-h-10 items-start justify-between gap-2 sm:min-h-0">
      <span className="text-label-lg font-semibold text-on-surface">{label}</span>
      <Icon name={icon} className={`text-[22px] ${iconClass}`} />
    </div>
    <div className="mt-2">
      {value === undefined ? (
        <Placeholder className="h-8 w-14 lg:h-[38px]" />
      ) : (
        <span className="text-headline-lg-mobile font-bold tracking-tight tabular-nums lg:text-headline-lg">{formatCount(value)}</span>
      )}
      <p className="mt-0.5 text-body-sm text-on-surface-variant">{caption}</p>
    </div>
  </div>
)

const StatusStat = ({ status, value }) => {
  const meta = APPOINTMENT_STATUS[status]

  return (
    <div className="flex flex-col items-center gap-0.5 rounded-lg bg-surface-container-lowest p-2 text-center shadow-sm transition-shadow hover:shadow-md lg:p-4">
      <span className="text-label-lg font-semibold text-on-surface">{meta.plural}</span>
      {value === undefined ? (
        <Placeholder className="my-1 h-7 w-8" />
      ) : (
        <span className={`my-0.5 text-headline-sm font-semibold tabular-nums lg:text-headline-md ${meta.figure}`}>{formatCount(value)}</span>
      )}
      <span aria-hidden="true" className={`flex size-6 items-center justify-center rounded-full ${meta.badge}`}>
        <Icon name={meta.icon} filled={meta.filled} className="text-[14px]" />
      </span>
    </div>
  )
}

const StatsSection = ({ stats, error, updatedAt, loading, onRefresh }) => (
  <section aria-labelledby="stats-title" className="flex flex-col gap-2">
    <div className="flex items-center justify-between gap-2 px-1">
      <h2 id="stats-title" className="text-label-lg font-semibold lg:text-headline-sm">Activité et statuts</h2>
      <div className="flex items-center gap-1 text-label-sm text-on-surface-variant">
        {updatedAt && <span>Mis à jour à {formatClockTime(updatedAt)}</span>}
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          aria-label="Actualiser le tableau de bord"
          title="Actualiser"
          className="flex size-8 items-center justify-center rounded-lg text-primary hover:bg-surface-container-low disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-primary"
        >
          <Icon name="refresh" className={`text-[18px] ${loading ? 'motion-safe:animate-spin' : ''}`} />
        </button>
      </div>
    </div>

    {error && stats && <StaleNotice updatedAt={updatedAt} />}

    {error && !stats ? (
      <BlockError message={error.message} onRetry={onRefresh} />
    ) : (
      <>
        <div className="grid grid-cols-2 gap-2 lg:gap-4">
          <MainStat
            label="Total patients"
            icon="groups"
            iconClass="text-primary"
            value={stats?.total_patients}
            caption="Dossiers actifs"
          />
          <MainStat
            label="Rendez-vous du jour"
            icon="event_available"
            iconClass="text-tertiary"
            value={stats?.today_appointments}
            caption="Tous statuts confondus"
          />
        </div>
        <div className="grid grid-cols-3 gap-1 lg:gap-4">
          <StatusStat status="pending" value={stats?.pending_appointments} />
          <StatusStat status="confirmed" value={stats?.confirmed_appointments} />
          <StatusStat status="cancelled" value={stats?.cancelled_appointments} />
        </div>
        <p className="px-1 text-body-sm text-on-surface-variant">Les statuts comptent tous les rendez-vous enregistrés.</p>
      </>
    )}
  </section>
)

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

const AppointmentSkeleton = () => (
  <div aria-hidden="true" className="flex flex-col gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-sm">
    <div className="flex items-center gap-2">
      <Placeholder className="size-10 rounded-full" />
      <div className="flex flex-col gap-1">
        <Placeholder className="h-4 w-32" />
        <Placeholder className="h-3 w-24" />
      </div>
    </div>
    <Placeholder className="h-4 w-full" />
  </div>
)

const TodayAppointments = ({ appointments, error, updatedAt, loading, unavailable, onRetry, onStatusChange, busyIds }) => (
  <section aria-labelledby="today-title" className="flex flex-col gap-2">
    <div className="flex items-center gap-1 px-1">
      <h2 id="today-title" className="text-headline-sm font-semibold">Rendez-vous</h2>
      <span className="rounded-full bg-surface-variant px-2 py-0.5 text-label-sm text-on-surface-variant">Aujourd'hui</span>
    </div>

    {error && appointments && <StaleNotice updatedAt={updatedAt} />}

    {error && !appointments && <BlockError message={error.message} onRetry={onRetry} />}

    {unavailable && (
      <p className="rounded-xl border border-dashed border-outline-variant p-4 text-body-md text-on-surface-variant">
        Les rendez-vous du jour s'afficheront dès que le tableau de bord sera chargé.
      </p>
    )}

    {!appointments && !error && loading && (
      <div className="flex flex-col gap-2">
        <AppointmentSkeleton />
        <AppointmentSkeleton />
      </div>
    )}

    {appointments && appointments.length === 0 && (
      <p className="rounded-xl border border-dashed border-outline-variant p-4 text-body-md text-on-surface-variant">
        Aucun rendez-vous aujourd'hui. Les nouveaux rendez-vous du jour apparaîtront ici.
      </p>
    )}

    {appointments && appointments.length > 0 && (
      <ul className="flex flex-col gap-2">
        {appointments.map((appointment) => (
          <li key={appointment.id}>
            <AppointmentCard appointment={appointment} onStatusChange={onStatusChange} busy={busyIds.has(appointment.id)} />
          </li>
        ))}
      </ul>
    )}
  </section>
)

const STATUS_MESSAGES = {
  confirmed: 'Rendez-vous confirmé.',
  cancelled: 'Rendez-vous annulé, le créneau est libéré.',
}

const DashboardPage = () => {
  const user = useSelector((state) => state.auth.user)
  const notify = useNotify()
  const [busyIds, setBusyIds] = useState(() => new Set())

  const stats = useApi(getDashboardStats)
  const today = stats.data?.today
  const fetchToday = useCallback(() => getAppointments({ date: today }), [today])
  const appointments = useApi(fetchToday, { enabled: Boolean(today) })

  const refresh = () => {
    stats.reload()
    appointments.reload()
  }

  const setBusy = (id, busy) =>
    setBusyIds((current) => {
      const next = new Set(current)
      if (busy) next.add(id)
      else next.delete(id)
      return next
    })

  const changeStatus = async (appointment, status) => {
    if (busyIds.has(appointment.id)) return

    setBusy(appointment.id, true)
    try {
      const updated = await updateAppointmentStatus(appointment.id, status)
      appointments.setData((list) => list.map((item) => (item.id === updated.id ? updated : item)))
      stats.reload()
      notify.success(STATUS_MESSAGES[status])
    } catch (error) {
      notify.error(error)
    } finally {
      setBusy(appointment.id, false)
    }
  }

  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-12 lg:items-start lg:gap-8">
      <div className="flex flex-col gap-4 lg:col-span-7 lg:gap-6">
        <GreetingCard
          user={user}
          today={today}
          appointments={appointments.data}
          loading={stats.loading || appointments.loading}
        />
        <div className="lg:hidden">
          <RuleBanner />
        </div>
        <StatsSection
          stats={stats.data}
          error={stats.error}
          updatedAt={stats.updatedAt}
          loading={stats.loading}
          onRefresh={refresh}
        />
      </div>

      <div className="flex flex-col gap-4 lg:col-span-5 lg:gap-6">
        <div className="hidden lg:block">
          <RuleBanner />
        </div>
        <TodayAppointments
          appointments={appointments.data}
          error={appointments.error}
          updatedAt={appointments.updatedAt}
          loading={appointments.loading || stats.loading}
          unavailable={Boolean(stats.error) && !today}
          onRetry={refresh}
          onStatusChange={changeStatus}
          busyIds={busyIds}
        />
      </div>
    </div>
  )
}

export default DashboardPage
