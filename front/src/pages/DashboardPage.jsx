import { useState } from 'react'
import { useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router'
import {
  ArrowUpRight,
  CalendarDays,
  CalendarPlus,
  CircleCheck,
  Clock,
  Download,
  Ellipsis,
  LoaderCircle,
  Plus,
  RefreshCw,
  UserPlus,
  Users,
} from 'lucide-react'
import { getDashboardStats } from '../api/dashboardService'
import { getAppointments } from '../api/appointmentService'
import { APPOINTMENT_STATUS } from '../config/appointments'
import { useApi } from '../hooks/useApi'
import { useCountUp } from '../hooks/useCountUp'
import { useNotify } from '../hooks/useNotify'
import { useOverlay } from '../hooks/useOverlay'
import { exportPatients } from '../utils/exportPatients'
import {
  addDays,
  clinicToday,
  firstName,
  formatClockTime,
  formatCount,
  formatLongDate,
  formatWeekday,
  greeting,
  isoWeekNumber,
  plural,
  startOfWeek,
} from '../utils/format'
import Alert from '../components/Alert'
import AppointmentDetailModal from '../components/AppointmentDetailModal'
import StatusChip from '../components/StatusChip'

const KpiValue = ({ value }) => {
  const shown = useCountUp(value)
  if (typeof value !== 'number') return <span className="skeleton h-8 w-16" />
  return formatCount(shown)
}

const Kpi = ({ icon: KpiIcon, tone, label, value, tag, foot }) => (
  <div className="card kpi">
    <div className="kpi-top">
      <span className="kpi-icn" style={tone}>
        <KpiIcon aria-hidden="true" />
      </span>
      {tag}
    </div>
    <div className="kpi-label">{label}</div>
    <div className="kpi-value"><KpiValue value={value} /></div>
    <div className="kpi-foot">{foot}</div>
  </div>
)

const TodayRow = ({ appointment, onOpen }) => {
  const meta = APPOINTMENT_STATUS[appointment.status]

  return (
    <div className={`tl-row ${appointment.status}`}>
      <span className="tl-time">{appointment.local_time}</span>
      <span className="tl-dot" style={{ background: meta.dot }} />
      <div className="min-w-0">
        <div className="tl-name">{appointment.patient_name}</div>
        <div className="tl-type">{appointment.reason}</div>
      </div>
      <StatusChip status={appointment.status} />
      <button type="button" className="icon-btn sm" onClick={() => onOpen(appointment)} aria-label={`Détails du rendez-vous de ${appointment.patient_name}`}>
        <Ellipsis aria-hidden="true" />
      </button>
    </div>
  )
}

const TodaySkeleton = () => (
  <div aria-hidden="true" className="today-list">
    {[0, 1, 2].map((row) => (
      <div key={row} className="tl-row">
        <span className="skeleton h-4 w-10" />
        <span className="skeleton size-2 rounded-full!" />
        <div className="flex flex-col gap-1.5">
          <span className="skeleton h-3.5 w-36" />
          <span className="skeleton h-3 w-24" />
        </div>
      </div>
    ))}
  </div>
)

const WeekChart = ({ today, appointments }) => {
  const start = startOfWeek(today)
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index))
  const counts = days.map((day) =>
    (appointments ?? []).filter((appointment) => appointment.local_date === day && appointment.status !== 'cancelled').length,
  )
  const max = Math.max(1, ...counts)
  const total = counts.reduce((sum, value) => sum + value, 0)

  return (
    <div className="card chart-card">
      <div className="card-head">
        <div>
          <div className="eyebrow">Activité clinique</div>
          <h2 className="mt-1 text-white">Votre semaine</h2>
        </div>
        <span className="chip bg-[rgba(234,255,248,.12)] text-[#9fe8d5]">Semaine {isoWeekNumber(today)}</span>
      </div>
      <div className="bars" role="img" aria-label={`Rendez-vous planifiés par jour cette semaine : ${days.map((day, index) => `${formatWeekday(day)} ${counts[index]}`).join(', ')}`}>
        {days.map((day, index) => (
          <div key={day} className={`bar-col ${day === today ? 'is-today' : ''}`}>
            <div className="bar-track">
              <div
                className={`bar ${day === today ? 'today' : ''}`}
                data-v={counts[index]}
                style={{ height: `${(counts[index] / max) * 100}%`, animationDelay: `${index * 70}ms` }}
              />
            </div>
            <span className="bar-lbl">{formatWeekday(day).charAt(0).toUpperCase()}</span>
          </div>
        ))}
      </div>
      <div className="chart-foot">
        <span>Rendez-vous planifiés</span>
        <b>{appointments ? `${formatCount(total)} cette semaine` : '…'}</b>
      </div>
    </div>
  )
}

const DashboardPage = () => {
  const navigate = useNavigate()
  const notify = useNotify()
  const { open } = useOverlay()
  const user = useSelector((state) => state.auth.user)
  const stats = useApi(getDashboardStats)
  const appointments = useApi(getAppointments)
  const [selected, setSelected] = useState(null)
  const [exporting, setExporting] = useState(false)

  const today = stats.data?.today ?? clinicToday()
  const todayList = appointments.data?.filter((appointment) => appointment.local_date === today)
  const s = stats.data

  const refresh = () => {
    stats.reload()
    appointments.reload()
  }

  const runExport = async () => {
    setExporting(true)
    try {
      const count = await exportPatients()
      notify.success(`Export CSV téléchargé (${plural(count, 'patient')}).`)
    } catch (error) {
      notify.error(error)
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <div className="page-head stagger">
        <div>
          <div className="eyebrow">Vue d'ensemble</div>
          <h1 className="page-title">
            {greeting()} {firstName(user?.full_name)} <span aria-hidden="true">👋</span>
          </h1>
          <p className="page-sub">
            {formatLongDate(today)}
            {stats.updatedAt && <span>· Mis à jour à {formatClockTime(stats.updatedAt)}</span>}
            <button type="button" className="icon-btn sm" onClick={refresh} aria-label="Actualiser le tableau de bord" title="Actualiser">
              <RefreshCw aria-hidden="true" className={stats.loading || appointments.loading ? 'spin' : ''} />
            </button>
          </p>
        </div>
        <div className="page-actions">
          <Link to="/appointments" className="btn btn-outline">
            <CalendarDays aria-hidden="true" />
            Voir le planning
          </Link>
          <button type="button" className="btn btn-primary" onClick={() => open('new-appointment')}>
            <Plus aria-hidden="true" />
            Nouveau rendez-vous
          </button>
        </div>
      </div>

      {stats.error && (
        <Alert className="mb-4" action={<button type="button" className="link-btn" onClick={stats.reload}>Réessayer</button>}>
          {s ? `Actualisation impossible. ${stats.error.message}` : stats.error.message}
        </Alert>
      )}

      <div className="kpis stagger">
        <Kpi
          icon={Users}
          tone={{ background: 'var(--brand-100)', color: 'var(--brand-ink)' }}
          label="Total patients"
          value={s?.total_patients}
          tag={<span className="tag chip-brand">Dossiers actifs</span>}
          foot="Patients enregistrés à la clinique"
        />
        <Kpi
          icon={CalendarDays}
          tone={{ background: 'var(--info-bg)', color: 'var(--info)' }}
          label="Rendez-vous aujourd'hui"
          value={s?.today_appointments}
          tag={<span className="tag chip-info">Aujourd'hui</span>}
          foot="Tous statuts confondus"
        />
        <Kpi
          icon={Clock}
          tone={{ background: 'var(--warn-bg)', color: 'var(--warn)' }}
          label="En attente de confirmation"
          value={s?.pending_appointments}
          tag={<span className="tag chip-warn">À traiter</span>}
          foot="Tous les rendez-vous enregistrés"
        />
        <Kpi
          icon={CircleCheck}
          tone={{ background: 'var(--ok-bg)', color: 'var(--ok)' }}
          label="Rendez-vous confirmés"
          value={s?.confirmed_appointments}
          tag={s && <span className="tag chip-danger">{plural(s.cancelled_appointments, 'annulé')}</span>}
          foot="Tous les rendez-vous enregistrés"
        />
      </div>

      <div className="dash-grid page-fill stagger">
        <section className="card today-card" aria-labelledby="today-title">
          <div className="card-head">
            <div>
              <h2 id="today-title">Rendez-vous du jour</h2>
              <small>
                {formatLongDate(today)}
                {todayList && ` · ${plural(todayList.length, 'rendez-vous', 'rendez-vous')}`}
              </small>
            </div>
            <Link to={`/appointments?date=${today}`} className="link-btn">
              Voir le planning <ArrowUpRight aria-hidden="true" />
            </Link>
          </div>

          {appointments.error && !todayList && (
            <div className="p-4">
              <Alert action={<button type="button" className="link-btn" onClick={appointments.reload}>Réessayer</button>}>
                {appointments.error.message}
              </Alert>
            </div>
          )}
          {!todayList && !appointments.error && <TodaySkeleton />}
          {todayList?.length === 0 && (
            <div className="empty">
              <span className="empty-icn"><CalendarDays aria-hidden="true" /></span>
              <b>Aucun rendez-vous aujourd'hui</b>
              <p>Les nouveaux rendez-vous du jour apparaîtront ici.</p>
              <button type="button" className="btn btn-outline mt-2" onClick={() => open('new-appointment')}>
                <Plus aria-hidden="true" />
                Planifier un rendez-vous
              </button>
            </div>
          )}
          {todayList?.length > 0 && (
            <div className="today-list">
              {todayList.map((appointment) => (
                <TodayRow key={appointment.id} appointment={appointment} onOpen={setSelected} />
              ))}
            </div>
          )}
        </section>

        <div className="dash-side">
          <WeekChart today={today} appointments={appointments.data} />

          <div className="card quick-card">
            <h2>Actions rapides</h2>
            <div className="quick-grid">
              <button type="button" className="q-btn" onClick={() => open('new-patient')}>
                <span className="q-icn"><UserPlus aria-hidden="true" /></span>
                Nouveau patient
              </button>
              <button type="button" className="q-btn" onClick={() => open('new-appointment')}>
                <span className="q-icn"><CalendarPlus aria-hidden="true" /></span>
                Nouveau RDV
              </button>
              <button type="button" className="q-btn" onClick={runExport} disabled={exporting}>
                <span className="q-icn">{exporting ? <LoaderCircle aria-hidden="true" className="spin" /> : <Download aria-hidden="true" />}</span>
                {exporting ? 'Export en cours…' : 'Exporter (CSV)'}
              </button>
              <button type="button" className="q-btn" onClick={() => navigate('/patients')}>
                <span className="q-icn"><Users aria-hidden="true" /></span>
                Répertoire patients
              </button>
            </div>
          </div>
        </div>
      </div>

      {selected && <AppointmentDetailModal appointment={selected} onClose={() => setSelected(null)} />}
    </>
  )
}

export default DashboardPage
