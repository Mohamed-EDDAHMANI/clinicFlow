import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { CalendarClock, CalendarPlus, Cake, Clock, History, IdCard, MapPin, Pencil, Phone, Trash2, X } from 'lucide-react'
import { getPatient, deletePatient } from '../api/patientService'
import { getAppointments } from '../api/appointmentService'
import { ROLES } from '../config/roles'
import { dataChanged } from '../features/refreshSlice'
import { useApi } from '../hooks/useApi'
import { useNotify } from '../hooks/useNotify'
import { useOverlay } from '../hooks/useOverlay'
import { ageFrom, dayOfMonth, formatMonth, formatShortDate, formatTimestamp, isPast } from '../utils/format'
import Alert from './Alert'
import AppointmentDetailModal from './AppointmentDetailModal'
import Avatar from './Avatar'
import ConfirmDialog from './ConfirmDialog'
import StatusChip from './StatusChip'

const HISTORY_LIMIT = 5

const AppointmentItem = ({ appointment, onOpen }) => (
  <button type="button" className="dr-appt" onClick={() => onOpen(appointment)}>
    <span className="when">
      <b>{dayOfMonth(appointment.local_date)}</b>
      <small>{formatMonth(appointment.local_date)}</small>
    </span>
    <span className="what">
      <b>{appointment.reason}</b>
      <small>{formatShortDate(appointment.local_date)} · {appointment.local_time}</small>
    </span>
    <StatusChip status={appointment.status} />
  </button>
)

const DrawerSkeleton = () => (
  <div aria-hidden="true" className="dr-body">
    {[0, 1, 2].map((section) => (
      <div key={section} className="dr-sec flex flex-col gap-3">
        <span className="skeleton h-3 w-24" />
        <span className="skeleton h-9 w-full" />
        <span className="skeleton h-9 w-full" />
      </div>
    ))}
  </div>
)

const PatientDrawer = ({ patientId }) => {
  const dispatch = useDispatch()
  const notify = useNotify()
  const { open, closePatient } = useOverlay()
  const canDelete = useSelector((state) => state.auth.user?.role === ROLES.ADMIN)
  const [selected, setSelected] = useState(null)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const drawerRef = useRef(null)

  const fetchPatient = useCallback(() => getPatient(patientId), [patientId])
  const fetchAppointments = useCallback(
    () => getAppointments().then((list) => list.filter((appointment) => appointment.patient_id === patientId)),
    [patientId],
  )
  const patient = useApi(fetchPatient)
  const appointments = useApi(fetchAppointments)

  useEffect(() => {
    const previous = document.activeElement
    drawerRef.current?.focus()
    return () => previous?.focus?.()
  }, [])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !document.querySelector('.modal-wrap')) closePatient()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [closePatient])

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await deletePatient(patientId)
      notify.success(`Le dossier de ${patient.data.full_name} a été supprimé.`)
      setConfirming(false)
      closePatient()
      dispatch(dataChanged())
    } catch (error) {
      notify.error(error)
    } finally {
      setDeleting(false)
    }
  }

  const list = appointments.data ?? []
  const upcoming = list.filter((appointment) => !isPast(appointment.local_date, appointment.local_time))
  const history = list.filter((appointment) => isPast(appointment.local_date, appointment.local_time)).reverse()
  const data = patient.data?.id === patientId ? patient.data : null

  return (
    <div className="drawer-wrap">
      <div className="drawer-backdrop" onClick={closePatient} />
      <aside ref={drawerRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="drawer-title" className="drawer outline-none">
        <div className="dr-head">
          {data ? <Avatar name={data.full_name} seed={data.id} large /> : <span className="skeleton size-13 rounded-full!" />}
          <div className="min-w-0">
            <h3 id="drawer-title" className="truncate">{data?.full_name ?? 'Fiche patient'}</h3>
            {data && <span className="chip chip-brand">{ageFrom(data.birth_date)} ans</span>}
          </div>
          <button type="button" className="icon-btn" onClick={closePatient} aria-label="Fermer la fiche">
            <X aria-hidden="true" />
          </button>
        </div>

        {patient.error && !data && (
          <div className="dr-body">
            <Alert>{patient.error.message}</Alert>
          </div>
        )}

        {!patient.error && !data && <DrawerSkeleton />}

        {data && (
          <div className="dr-body stagger">
            <div className="dr-sec">
              <h4>Coordonnées</h4>
              <div className="dr-row"><Phone aria-hidden="true" />Téléphone<a href={`tel:${data.phone}`} className="num">{data.phone}</a></div>
              <div className="dr-row"><MapPin aria-hidden="true" />Adresse<b>{data.address || <span className="muted font-normal">Non renseignée</span>}</b></div>
            </div>

            <div className="dr-sec">
              <h4>Dossier administratif</h4>
              <div className="dr-row"><IdCard aria-hidden="true" />N° CIN<b className="num">{data.cin}</b></div>
              <div className="dr-row"><Cake aria-hidden="true" />Naissance<b>{formatShortDate(data.birth_date)}</b></div>
              <div className="dr-row"><Clock aria-hidden="true" />Dossier créé le<b>{formatTimestamp(data.created_at)}</b></div>
            </div>

            <div className="dr-sec">
              <h4>
                <span className="flex items-center gap-1.5"><CalendarClock aria-hidden="true" className="[--sz:14px]" />Rendez-vous à venir</span>
                {appointments.data && <span>{upcoming.length}</span>}
              </h4>
              {appointments.error && <Alert>{appointments.error.message}</Alert>}
              {!appointments.data && !appointments.error && <span className="skeleton h-16 w-full" />}
              {appointments.data && upcoming.length === 0 && <div className="dl"><span>Aucun rendez-vous à venir</span><b>—</b></div>}
              {upcoming.map((appointment) => (
                <AppointmentItem key={appointment.id} appointment={appointment} onOpen={setSelected} />
              ))}
            </div>

            {history.length > 0 && (
              <div className="dr-sec">
                <h4>
                  <span className="flex items-center gap-1.5"><History aria-hidden="true" className="[--sz:14px]" />Historique</span>
                  <span>{history.length}</span>
                </h4>
                {history.slice(0, HISTORY_LIMIT).map((appointment) => (
                  <AppointmentItem key={appointment.id} appointment={appointment} onOpen={setSelected} />
                ))}
                {history.length > HISTORY_LIMIT && (
                  <p className="muted mt-2 text-xs">+ {history.length - HISTORY_LIMIT} rendez-vous plus anciens</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="dr-foot">
          <button type="button" className="btn btn-primary" disabled={!data} onClick={() => open('new-appointment', { id: patientId })}>
            <CalendarPlus aria-hidden="true" />
            RDV
          </button>
          <button type="button" className="btn btn-outline" disabled={!data} onClick={() => open('edit-patient', { id: patientId })}>
            <Pencil aria-hidden="true" />
            Modifier
          </button>
          {canDelete && (
            <button type="button" className="icon-btn danger" disabled={!data} onClick={() => setConfirming(true)} aria-label="Supprimer le dossier" title="Supprimer">
              <Trash2 aria-hidden="true" />
            </button>
          )}
        </div>
      </aside>

      {selected && <AppointmentDetailModal appointment={selected} onClose={() => setSelected(null)} />}

      <ConfirmDialog
        open={confirming}
        title="Supprimer ce dossier ?"
        confirmLabel="Supprimer"
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => !deleting && setConfirming(false)}
      >
        {data && (
          <p>
            Le dossier de <strong className="text-(--ink)">{data.full_name}</strong> (CIN {data.cin}) et ses rendez-vous ne seront plus visibles dans ClinicFlow.
          </p>
        )}
      </ConfirmDialog>
    </div>
  )
}

export default PatientDrawer
