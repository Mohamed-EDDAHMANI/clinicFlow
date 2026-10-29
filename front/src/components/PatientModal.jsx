import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useDispatch } from 'react-redux'
import { Cake, IdCard, LoaderCircle, MapPin, Phone, Save, User } from 'lucide-react'
import { createPatient, getPatient, updatePatient } from '../api/patientService'
import { patientSchema, PATIENT_FIELDS } from '../schemas/patientSchema'
import { dataChanged } from '../features/refreshSlice'
import { useApi } from '../hooks/useApi'
import { useNotify } from '../hooks/useNotify'
import { applyApiError } from '../utils/formErrors'
import { fieldProps } from '../utils/fieldProps'
import { clinicToday } from '../utils/format'
import Alert from './Alert'
import Field from './Field'
import Modal from './Modal'

const EMPTY_VALUES = { full_name: '', cin: '', phone: '', birth_date: '', address: '' }

const toFormValues = (patient) => ({
  full_name: patient.full_name,
  cin: patient.cin,
  phone: patient.phone,
  birth_date: patient.birth_date,
  address: patient.address ?? '',
})

const PatientForm = ({ patient, onClose, onSaved }) => {
  const notify = useNotify()
  const dispatch = useDispatch()
  const editing = Boolean(patient)

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
      dispatch(dataChanged())
      onSaved(saved, editing)
    } catch (error) {
      applyApiError(error, setError, PATIENT_FIELDS)
    }
  }

  const cinHint = 'Lettres et chiffres, sans espace.'

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="md-body">
      {errors.root && <Alert>{errors.root.message}</Alert>}

      <Field id="full_name" label="Nom complet" icon={User} error={errors.full_name}>
        <input className="input" type="text" autoComplete="off" placeholder="ex : Fatima Zahra Alaoui" {...fieldProps('full_name', errors.full_name)} {...register('full_name')} />
      </Field>

      <div className="two">
        <Field id="phone" label="Téléphone" icon={Phone} error={errors.phone}>
          <input className="input" type="tel" inputMode="tel" autoComplete="off" placeholder="0612345678" {...fieldProps('phone', errors.phone)} {...register('phone')} />
        </Field>
        <Field id="cin" label="N° CIN" icon={IdCard} error={errors.cin} hint={cinHint}>
          <input className="input uppercase placeholder:normal-case" type="text" autoComplete="off" placeholder="AB123456" {...fieldProps('cin', errors.cin, cinHint)} {...register('cin')} />
        </Field>
      </div>

      <Field id="birth_date" label="Date de naissance" icon={Cake} error={errors.birth_date}>
        <input className="input" type="date" max={clinicToday()} {...fieldProps('birth_date', errors.birth_date)} {...register('birth_date')} />
      </Field>

      <Field id="address" label="Adresse (facultatif)" icon={MapPin} error={errors.address}>
        <textarea className="input" rows={2} placeholder="ex : 12 rue Ibn Sina, Casablanca" {...fieldProps('address', errors.address)} {...register('address')} />
      </Field>

      <div className="md-foot">
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>
          Annuler
        </button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? <LoaderCircle aria-hidden="true" className="spin" /> : <Save aria-hidden="true" />}
          {isSubmitting ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Créer le dossier'}
        </button>
      </div>
    </form>
  )
}

const FormSkeleton = () => (
  <div aria-hidden="true" className="md-body">
    {[0, 1, 2, 3].map((row) => (
      <div key={row} className="flex flex-col gap-2">
        <span className="skeleton h-3.5 w-28" />
        <span className="skeleton h-11 w-full rounded-xl" />
      </div>
    ))}
  </div>
)

const EditPatient = ({ id, onClose, onSaved }) => {
  const fetchPatient = useCallback(() => getPatient(id), [id])
  const { data, error, loading, reload } = useApi(fetchPatient)

  if (error) {
    return (
      <div className="md-body">
        <Alert
          action={error.status !== 404 && error.status !== 400 && (
            <button type="button" className="link-btn" onClick={reload}>Réessayer</button>
          )}
        >
          {error.message}
        </Alert>
      </div>
    )
  }

  if (loading || !data) return <FormSkeleton />

  return <PatientForm key={data.id} patient={data} onClose={onClose} onSaved={onSaved} />
}

const PatientModal = ({ id, onClose, onSaved }) => (
  <Modal title={id ? 'Modifier le dossier' : 'Ajouter un patient'} onClose={onClose}>
    {id ? <EditPatient id={id} onClose={onClose} onSaved={onSaved} /> : <PatientForm onClose={onClose} onSaved={onSaved} />}
  </Modal>
)

export default PatientModal
