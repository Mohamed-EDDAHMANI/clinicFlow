import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router'
import { createAppointment } from '../api/appointmentService'
import { appointmentSchema, APPOINTMENT_FIELDS, toAppointmentPayload } from '../schemas/appointmentSchema'
import { useNotify } from '../hooks/useNotify'
import { applyApiError } from '../utils/formErrors'
import { formatLongDate, localToday } from '../utils/format'
import { APPOINTMENT_STATUS } from '../config/appointments'
import Icon from '../components/Icon'
import Alert from '../components/Alert'
import FieldError from '../components/FieldError'
import PatientPicker from '../components/PatientPicker'

const fieldClass =
  'w-full rounded-lg bg-surface-container-lowest pl-10 pr-4 text-body-md text-on-surface shadow-sm ' +
  'ring-1 ring-inset ring-outline-variant/70 placeholder:text-on-surface-variant ' +
  'focus:outline-none focus:bg-surface-container-low focus:ring-2 focus:ring-primary transition-colors ' +
  'aria-[invalid=true]:ring-error'

const STATUS_OPTIONS = [
  { value: 'pending', hint: 'Le créneau reste à valider avec le patient.' },
  { value: 'confirmed', hint: 'Bloque le créneau : pas d’autre RDV confirmé à moins de 30 minutes.' },
]

const Field = ({ id, label, icon, error, className = '', children }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <label htmlFor={id} className="text-label-md font-medium">{label}</label>
    <div className="relative flex">
      <Icon name={icon} className="pointer-events-none absolute top-3 left-3 text-[20px] text-on-surface-variant" />
      {children}
    </div>
    <FieldError id={`${id}-error`} error={error} />
  </div>
)

const AppointmentFormPage = () => {
  const navigate = useNavigate()
  const notify = useNotify()
  const [patient, setPatient] = useState(null)
  const today = localToday()

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    control,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm({
    resolver: zodResolver(appointmentSchema),
    defaultValues: { patient_id: '', date: today, time: '', reason: '', status: 'pending', notes: '' },
  })

  const selectPatient = (selected) => {
    setPatient(selected)
    setValue('patient_id', selected?.id ?? '', { shouldValidate: isSubmitted })
  }

  const onSubmit = async (values) => {
    try {
      const created = await createAppointment(toAppointmentPayload(values))
      notify.success(`Rendez-vous de ${created.patient_name} planifié le ${formatLongDate(created.local_date).toLowerCase()} à ${created.local_time}.`)
      navigate(`/appointments?date=${created.local_date}`)
    } catch (error) {
      applyApiError(error, setError, APPOINTMENT_FIELDS)
    }
  }

  const input = (id) => ({
    id,
    'aria-invalid': Boolean(errors[id]),
    'aria-describedby': errors[id] ? `${id}-error` : undefined,
    ...register(id),
  })

  const status = useWatch({ control, name: 'status' })

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Link
          to="/appointments"
          className="flex h-9 items-center gap-1 self-start rounded-lg pr-2 text-label-lg text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <Icon name="arrow_back" className="text-[20px]" />
          Retour au planning
        </Link>
        <h1 className="text-headline-sm font-semibold lg:text-headline-md">Nouveau rendez-vous</h1>
        <p className="text-body-sm text-on-surface-variant lg:text-body-md">
          Choisissez le patient, le créneau et le motif. L’heure est celle de la clinique.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6 rounded-xl bg-surface-container-lowest p-4 shadow-sm sm:p-6 lg:p-8">
        {errors.root && <Alert>{errors.root.message}</Alert>}

        <fieldset className="flex flex-col gap-1">
          <legend className="mb-4 text-label-lg font-semibold text-primary">Patient</legend>
          <label htmlFor="patient-search" className="sr-only">Rechercher un patient</label>
          <input type="hidden" {...register('patient_id')} />
          <PatientPicker
            id="patient-search"
            value={patient}
            onChange={selectPatient}
            invalid={Boolean(errors.patient_id)}
            describedBy={errors.patient_id ? 'patient_id-error' : undefined}
          />
          <FieldError id="patient_id-error" error={errors.patient_id} />
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-4 text-label-lg font-semibold text-primary">Créneau</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="date" label="Date" icon="calendar_today" error={errors.date}>
              <input type="date" min={today} className={`${fieldClass} h-11`} {...input('date')} />
            </Field>
            <Field id="time" label="Heure" icon="schedule" error={errors.time}>
              <input type="time" step={300} className={`${fieldClass} h-11`} {...input('time')} />
            </Field>
          </div>

          <div className="flex flex-col gap-2">
            <span id="status-label" className="text-label-md font-medium">Statut</span>
            <div role="radiogroup" aria-labelledby="status-label" className="grid gap-2 sm:grid-cols-2">
              {STATUS_OPTIONS.map((option) => {
                const meta = APPOINTMENT_STATUS[option.value]
                const checked = status === option.value
                return (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-start gap-2 rounded-lg p-3 ring-1 ring-inset transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary ${
                      checked ? 'bg-surface-container-low ring-primary' : 'ring-outline-variant/70 hover:bg-surface-container-low'
                    }`}
                  >
                    <input type="radio" value={option.value} className="sr-only" {...register('status')} />
                    <span aria-hidden="true" className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${meta.badge}`}>
                      <Icon name={meta.icon} filled={meta.filled} className="text-[14px]" />
                    </span>
                    <span className="flex flex-col">
                      <span className="text-label-lg font-semibold">{meta.label}</span>
                      <span className="text-body-sm text-on-surface-variant">{option.hint}</span>
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-4 text-label-lg font-semibold text-primary">Consultation</legend>
          <Field id="reason" label="Motif" icon="stethoscope" error={errors.reason}>
            <input type="text" autoComplete="off" placeholder="ex : Suivi tension artérielle" className={`${fieldClass} h-11`} {...input('reason')} />
          </Field>
          <Field id="notes" label="Notes (facultatif)" icon="notes" error={errors.notes}>
            <textarea rows={3} placeholder="ex : Apporter les dernières analyses" className={`${fieldClass} resize-y py-2.5`} {...input('notes')} />
          </Field>
        </fieldset>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
          <Link
            to="/appointments"
            className="flex h-11 items-center justify-center rounded-lg bg-surface-container px-4 text-label-lg font-semibold text-on-surface hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-11 items-center justify-center gap-1 rounded-lg bg-primary px-4 text-label-lg font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-container active:scale-[0.98] disabled:cursor-wait disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Icon
              name={isSubmitting ? 'progress_activity' : 'event_available'}
              className={`text-[20px] ${isSubmitting ? 'motion-safe:animate-spin' : ''}`}
            />
            {isSubmitting ? 'Planification…' : 'Planifier le RDV'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AppointmentFormPage
