import { useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useParams } from 'react-router'
import { createPatient, getPatient, updatePatient } from '../api/patientService'
import { patientSchema, PATIENT_FIELDS } from '../schemas/patientSchema'
import { useApi } from '../hooks/useApi'
import { useNotify } from '../hooks/useNotify'
import { applyApiError } from '../utils/formErrors'
import Icon from '../components/Icon'
import Alert from '../components/Alert'
import FieldError from '../components/FieldError'

const EMPTY_VALUES = { full_name: '', cin: '', phone: '', birth_date: '', address: '' }

const toFormValues = (patient) => ({
  full_name: patient.full_name,
  cin: patient.cin,
  phone: patient.phone,
  birth_date: patient.birth_date,
  address: patient.address ?? '',
})

const fieldClass =
  'w-full rounded-lg bg-surface-container-lowest pl-10 pr-4 text-body-md text-on-surface shadow-sm ' +
  'ring-1 ring-inset ring-outline-variant/70 placeholder:text-on-surface-variant ' +
  'focus:outline-none focus:bg-surface-container-low focus:ring-2 focus:ring-primary transition-colors ' +
  'aria-[invalid=true]:ring-error'

const Field = ({ id, label, icon, hint, error, className = '', children }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <label htmlFor={id} className="text-label-md font-medium">{label}</label>
    <div className="relative flex">
      <Icon name={icon} className="pointer-events-none absolute top-3 left-3 text-[20px] text-on-surface-variant" />
      {children}
    </div>
    {hint && !error && <p id={`${id}-hint`} className="text-body-sm text-on-surface-variant">{hint}</p>}
    <FieldError id={`${id}-error`} error={error} />
  </div>
)

const describedBy = (id, error, hint) => (error ? `${id}-error` : hint ? `${id}-hint` : undefined)

const PatientForm = ({ patient }) => {
  const navigate = useNavigate()
  const notify = useNotify()
  const editing = Boolean(patient)
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(patientSchema),
    defaultValues: patient ? toFormValues(patient) : EMPTY_VALUES,
  })

  const onSubmit = async (values) => {
    try {
      const saved = editing ? await updatePatient(patient.id, values) : await createPatient(values)
      notify.success(editing ? `Dossier de ${saved.full_name} mis à jour.` : `Dossier de ${saved.full_name} créé.`)
      navigate('/patients')
    } catch (error) {
      applyApiError(error, setError, PATIENT_FIELDS)
    }
  }

  const input = (id, options = {}) => ({
    id,
    'aria-invalid': Boolean(errors[id]),
    'aria-describedby': describedBy(id, errors[id], options.hint),
    ...register(id),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6 rounded-xl bg-surface-container-lowest p-4 shadow-sm sm:p-6 lg:p-8">
      {errors.root && <Alert>{errors.root.message}</Alert>}

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-4 text-label-lg font-semibold text-primary">Identité</legend>
        <Field id="full_name" label="Nom complet" icon="person" error={errors.full_name}>
          <input type="text" autoComplete="off" placeholder="ex : Fatima Zahra Alaoui" className={`${fieldClass} h-11`} {...input('full_name')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="cin" label="CIN" icon="badge" hint="Lettres et chiffres, sans espace." error={errors.cin}>
            <input type="text" autoComplete="off" placeholder="ex : AB123456" className={`${fieldClass} h-11 uppercase placeholder:normal-case`} {...input('cin', { hint: true })} />
          </Field>
          <Field id="birth_date" label="Date de naissance" icon="cake" error={errors.birth_date}>
            <input type="date" max={today} className={`${fieldClass} h-11`} {...input('birth_date')} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-4 text-label-lg font-semibold text-primary">Coordonnées</legend>
        <Field id="phone" label="Téléphone" icon="call" error={errors.phone}>
          <input type="tel" inputMode="tel" autoComplete="off" placeholder="ex : 0612345678" className={`${fieldClass} h-11`} {...input('phone')} />
        </Field>
        <Field id="address" label="Adresse (facultatif)" icon="home" error={errors.address}>
          <textarea rows={3} placeholder="ex : 12 rue Ibn Sina, Casablanca" className={`${fieldClass} resize-y py-2.5`} {...input('address')} />
        </Field>
      </fieldset>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
        <Link
          to="/patients"
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
            name={isSubmitting ? 'progress_activity' : 'save'}
            className={`text-[20px] ${isSubmitting ? 'motion-safe:animate-spin' : ''}`}
          />
          {isSubmitting ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Créer le dossier'}
        </button>
      </div>
    </form>
  )
}

const FormSkeleton = () => (
  <div aria-hidden="true" className="flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-6 shadow-sm">
    {[0, 1, 2, 3].map((row) => (
      <div key={row} className="flex flex-col gap-1">
        <span className="block h-4 w-28 rounded bg-surface-container" />
        <span className="block h-11 w-full rounded-lg bg-surface-container" />
      </div>
    ))}
  </div>
)

const EditPatient = ({ id }) => {
  const fetchPatient = useCallback(() => getPatient(id), [id])
  const { data, error, loading, reload } = useApi(fetchPatient)

  if (error) {
    return (
      <div className="flex flex-col gap-2">
        <Alert>{error.message}</Alert>
        {error.status !== 404 && error.status !== 400 && (
          <button
            type="button"
            onClick={reload}
            className="flex h-10 items-center justify-center gap-1 self-start rounded-lg px-3 text-label-lg text-primary hover:bg-surface-container-low focus-visible:outline-2 focus-visible:outline-primary"
          >
            <Icon name="refresh" className="text-[18px]" />
            Réessayer
          </button>
        )}
      </div>
    )
  }

  if (loading || !data) return <FormSkeleton />

  return <PatientForm key={data.id} patient={data} />
}

const PatientFormPage = () => {
  const { id } = useParams()
  const editing = Boolean(id)

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Link
          to="/patients"
          className="flex h-9 items-center gap-1 self-start rounded-lg pr-2 text-label-lg text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <Icon name="arrow_back" className="text-[20px]" />
          Retour aux patients
        </Link>
        <h1 className="text-headline-sm font-semibold lg:text-headline-md">
          {editing ? 'Modifier le dossier' : 'Nouveau dossier patient'}
        </h1>
        <p className="text-body-sm text-on-surface-variant lg:text-body-md">
          {editing
            ? 'Mettez à jour les informations du patient. Le CIN doit rester unique.'
            : 'Renseignez l’identité et les coordonnées du patient. Tous les champs sont obligatoires sauf l’adresse.'}
        </p>
      </div>

      {editing ? <EditPatient id={id} /> : <PatientForm />}
    </div>
  )
}

export default PatientFormPage
