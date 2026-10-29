import { useCallback, useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useDispatch } from 'react-redux'
import { CalendarDays, CalendarPlus, CircleAlert, CircleCheck, Clock, FileText, LoaderCircle, Stethoscope } from 'lucide-react'
import { createAppointment } from '../api/appointmentService'
import { getPatient } from '../api/patientService'
import { appointmentSchema, APPOINTMENT_FIELDS, toAppointmentPayload } from '../schemas/appointmentSchema'
import { REASON_SUGGESTIONS } from '../config/appointments'
import { dataChanged } from '../features/refreshSlice'
import { useApi } from '../hooks/useApi'
import { useNotify } from '../hooks/useNotify'
import { applyApiError } from '../utils/formErrors'
import { fieldProps } from '../utils/fieldProps'
import { clinicToday, formatLongDate } from '../utils/format'
import Alert from './Alert'
import Field from './Field'
import Modal from './Modal'
import PatientPicker from './PatientPicker'

const TIME_SLOTS = Array.from({ length: (20 - 7) * 4 }, (_, index) => {
  const minutes = 7 * 60 + index * 15
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
})

const STATUS_OPTIONS = [
  {
    value: 'pending',
    label: 'En attente',
    hint: 'Le créneau reste à valider avec le patient.',
    icon: Clock,
    tone: 'chip-warn',
  },
  {
    value: 'confirmed',
    label: 'Confirmé',
    hint: 'Bloque le créneau : pas d’autre RDV confirmé à moins de 30 minutes.',
    icon: CircleCheck,
    tone: 'chip-ok',
  },
]

const AppointmentForm = ({ initialPatient, defaults, onClose }) => {
  const notify = useNotify()
  const dispatch = useDispatch()
  const reasonsId = useId()
  const [patient, setPatient] = useState(initialPatient)

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patient_id: initialPatient?.id ?? '',
      date: defaults.date,
      time: defaults.time,
      reason: '',
      status: 'pending',
      notes: '',
    },
  })

  const selectPatient = (selected) => {
    setPatient(selected)
    setValue('patient_id', selected?.id ?? '', { shouldValidate: isSubmitted })
  }

  const onSubmit = async (values) => {
    try {
      const created = await createAppointment(toAppointmentPayload(values))
      notify.success(`Rendez-vous de ${created.patient_name} planifié le ${formatLongDate(created.local_date).toLowerCase()} à ${created.local_time}.`)
      dispatch(dataChanged())
      onClose()
    } catch (error) {
      applyApiError(error, setError, APPOINTMENT_FIELDS)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="md-body">
      {errors.root && <Alert>{errors.root.message}</Alert>}

      <div className="appt-grid">
        <div className="field">
          <label htmlFor="patient-search">Patient</label>
          <input type="hidden" {...register('patient_id')} />
          <PatientPicker
            id="patient-search"
            value={patient}
            onChange={selectPatient}
            invalid={Boolean(errors.patient_id)}
            describedBy={errors.patient_id ? 'patient_id-error' : undefined}
            limit={4}
          />
          {errors.patient_id && (
            <p id="patient_id-error" className="err">
              <CircleAlert aria-hidden="true" />
              {errors.patient_id.message}
            </p>
          )}
        </div>

        <div className="appt-col">
          <div className="two">
            <Field id="date" label="Date" icon={CalendarDays} error={errors.date}>
              <input className="input" type="date" min={clinicToday()} {...fieldProps('date', errors.date)} {...register('date')} />
            </Field>
            <Field id="time" label="Heure" icon={Clock} error={errors.time}>
              <select className="input" {...fieldProps('time', errors.time)} {...register('time')}>
                <option value="">Choisir…</option>
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field id="reason" label="Motif" icon={Stethoscope} error={errors.reason}>
            <input className="input" type="text" list={reasonsId} autoComplete="off" placeholder="ex : Consultation générale" {...fieldProps('reason', errors.reason)} {...register('reason')} />
            <datalist id={reasonsId}>
              {REASON_SUGGESTIONS.map((reason) => (
                <option key={reason} value={reason} />
              ))}
            </datalist>
          </Field>

          <Field id="notes" label="Notes (facultatif)" icon={FileText} error={errors.notes}>
            <textarea className="input" rows={3} placeholder="ex : Apporter les dernières analyses" {...fieldProps('notes', errors.notes)} {...register('notes')} />
          </Field>
        </div>
      </div>

      <fieldset className="field">
        <legend className="mb-1.5 text-[12.5px] font-semibold text-(--ink-2)">Statut</legend>
        <div className="segmented">
          {STATUS_OPTIONS.map((option) => {
            const OptionIcon = option.icon
            return (
              <label key={option.value} className="seg-option relative">
                <input type="radio" value={option.value} {...register('status')} />
                <span className={`seg-icn ${option.tone}`}>
                  <OptionIcon aria-hidden="true" />
                </span>
                <span>
                  <b>{option.label}</b>
                  <small>{option.hint}</small>
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <div className="md-foot">
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>
          Annuler
        </button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? <LoaderCircle aria-hidden="true" className="spin" /> : <CalendarPlus aria-hidden="true" />}
          {isSubmitting ? 'Planification…' : 'Créer le rendez-vous'}
        </button>
      </div>
    </form>
  )
}

const PrefilledForm = ({ patientId, defaults, onClose }) => {
  const fetchPatient = useCallback(() => getPatient(patientId), [patientId])
  const { data, error, loading } = useApi(fetchPatient)

  if (loading && !data) {
    return (
      <div aria-hidden="true" className="md-body">
        <span className="skeleton h-14 w-full rounded-xl" />
        <span className="skeleton h-11 w-full rounded-xl" />
        <span className="skeleton h-11 w-full rounded-xl" />
      </div>
    )
  }

  return <AppointmentForm initialPatient={error ? null : data} defaults={defaults} onClose={onClose} />
}

const AppointmentModal = ({ patientId, date, time, onClose }) => {
  const today = clinicToday()
  const defaults = {
    date: date && date >= today ? date : today,
    time: time && /^\d{2}:\d{2}$/.test(time) ? time : '',
  }

  return (
    <Modal title="Nouveau rendez-vous" onClose={onClose} wide>
      {patientId
        ? <PrefilledForm patientId={patientId} defaults={defaults} onClose={onClose} />
        : <AppointmentForm initialPatient={null} defaults={defaults} onClose={onClose} />}
    </Modal>
  )
}

export default AppointmentModal
