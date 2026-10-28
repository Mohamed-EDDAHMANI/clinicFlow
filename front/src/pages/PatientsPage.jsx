import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link, useSearchParams } from 'react-router'
import { deletePatient, getPatients } from '../api/patientService'
import { useApi } from '../hooks/useApi'
import { useNotify } from '../hooks/useNotify'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { ROLES } from '../config/roles'
import { ageFrom, formatShortDate, initials, plural } from '../utils/format'
import Icon from '../components/Icon'
import Alert from '../components/Alert'
import ConfirmDialog from '../components/ConfirmDialog'

const PAGE_SIZE = 10

const readPage = (value) => {
  const page = Number.parseInt(value, 10)
  return Number.isInteger(page) && page > 0 ? page : 1
}

const Placeholder = ({ className = '' }) => (
  <span aria-hidden="true" className={`block rounded bg-surface-container ${className}`} />
)

const iconButtonClass =
  'flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-primary'

const PatientActions = ({ patient, canDelete, onDelete }) => (
  <div className="flex items-center gap-1">
    <Link
      to={`/patients/${patient.id}/edit`}
      aria-label={`Modifier ${patient.full_name}`}
      title="Modifier"
      className={`${iconButtonClass} text-primary hover:bg-surface-container-low`}
    >
      <Icon name="edit" className="text-[20px]" />
    </Link>
    {canDelete && (
      <button
        type="button"
        onClick={() => onDelete(patient)}
        aria-label={`Supprimer ${patient.full_name}`}
        title="Supprimer"
        className={`${iconButtonClass} text-error hover:bg-error-container`}
      >
        <Icon name="delete" className="text-[20px]" />
      </button>
    )}
  </div>
)

const PatientAvatar = ({ name }) => (
  <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-label-lg text-on-primary-fixed">
    {initials(name)}
  </span>
)

const PatientCard = ({ patient, canDelete, onDelete }) => (
  <article className="flex flex-col gap-2 rounded-xl bg-surface-container-lowest p-4 shadow-sm">
    <div className="flex items-start justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <PatientAvatar name={patient.full_name} />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-label-lg font-semibold">{patient.full_name}</span>
          <span className="truncate text-body-sm text-on-surface-variant">CIN : {patient.cin}</span>
        </div>
      </div>
      <PatientActions patient={patient} canDelete={canDelete} onDelete={onDelete} />
    </div>
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-12 text-body-sm text-on-surface-variant">
      <a href={`tel:${patient.phone}`} className="flex items-center gap-1 rounded hover:text-primary focus-visible:outline-2 focus-visible:outline-primary">
        <Icon name="call" className="text-[16px]" />
        <span className="tabular-nums">{patient.phone}</span>
      </a>
      <span className="flex items-center gap-1">
        <Icon name="cake" className="text-[16px]" />
        {ageFrom(patient.birth_date)} ans
      </span>
    </div>
  </article>
)

const PatientRow = ({ patient, canDelete, onDelete }) => (
  <tr className="border-t border-surface-container transition-colors hover:bg-surface-container-low/60">
    <td className="py-3 pr-4 pl-6">
      <div className="flex min-w-0 items-center gap-3">
        <PatientAvatar name={patient.full_name} />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-label-lg font-semibold">{patient.full_name}</span>
          {patient.address && <span className="truncate text-body-sm text-on-surface-variant">{patient.address}</span>}
        </div>
      </div>
    </td>
    <td className="px-4 py-3 text-body-md font-medium tabular-nums">{patient.cin}</td>
    <td className="px-4 py-3 text-body-md tabular-nums">
      <a href={`tel:${patient.phone}`} className="rounded hover:text-primary focus-visible:outline-2 focus-visible:outline-primary">
        {patient.phone}
      </a>
    </td>
    <td className="px-4 py-3 text-body-md">
      {formatShortDate(patient.birth_date)}
      <span className="text-on-surface-variant"> · {ageFrom(patient.birth_date)} ans</span>
    </td>
    <td className="py-3 pr-6 pl-4">
      <div className="flex justify-end">
        <PatientActions patient={patient} canDelete={canDelete} onDelete={onDelete} />
      </div>
    </td>
  </tr>
)

const ListSkeleton = () => (
  <div aria-hidden="true" className="flex flex-col gap-2 lg:gap-0 lg:overflow-hidden lg:rounded-xl lg:bg-surface-container-lowest lg:shadow-sm">
    {[0, 1, 2, 3].map((row) => (
      <div key={row} className="flex items-center gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-sm lg:rounded-none lg:px-6 lg:shadow-none">
        <Placeholder className="size-10 rounded-full" />
        <div className="flex flex-1 flex-col gap-1">
          <Placeholder className="h-4 w-40" />
          <Placeholder className="h-3 w-24" />
        </div>
      </div>
    ))}
  </div>
)

const EmptyState = ({ search, onClear }) => (
  <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-outline-variant px-4 py-10 text-center">
    <span className="flex size-12 items-center justify-center rounded-xl bg-surface-container-high text-primary">
      <Icon name={search ? 'search_off' : 'group_add'} className="text-[26px]" />
    </span>
    {search ? (
      <>
        <p className="text-label-lg font-semibold">Aucun patient ne correspond à « {search} »</p>
        <p className="max-w-sm text-body-md text-on-surface-variant">Vérifiez l'orthographe du nom ou le numéro de CIN.</p>
        <button
          type="button"
          onClick={onClear}
          className="mt-1 flex h-10 items-center gap-1 rounded-lg px-3 text-label-lg font-semibold text-primary hover:bg-surface-container-low focus-visible:outline-2 focus-visible:outline-primary"
        >
          <Icon name="close" className="text-[18px]" />
          Effacer la recherche
        </button>
      </>
    ) : (
      <>
        <p className="text-label-lg font-semibold">Aucun patient enregistré</p>
        <p className="max-w-sm text-body-md text-on-surface-variant">Ajoutez un premier dossier pour pouvoir planifier ses rendez-vous.</p>
      </>
    )}
  </div>
)

const Pagination = ({ meta, onChange, disabled }) => {
  if (meta.totalPages <= 1) return null

  const buttonClass =
    'flex h-10 items-center gap-1 rounded-lg bg-surface-container-lowest px-3 text-label-lg font-semibold text-on-surface shadow-sm hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-primary'

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-2">
      <button type="button" onClick={() => onChange(meta.page - 1)} disabled={disabled || meta.page <= 1} className={buttonClass}>
        <Icon name="chevron_left" className="text-[20px]" />
        Précédent
      </button>
      <span className="text-label-md text-on-surface-variant tabular-nums">
        Page {meta.page} sur {meta.totalPages}
      </span>
      <button type="button" onClick={() => onChange(meta.page + 1)} disabled={disabled || meta.page >= meta.totalPages} className={buttonClass}>
        Suivant
        <Icon name="chevron_right" className="text-[20px]" />
      </button>
    </nav>
  )
}

const PatientsPage = () => {
  const notify = useNotify()
  const user = useSelector((state) => state.auth.user)
  const canDelete = user?.role === ROLES.ADMIN
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('search') ?? ''
  const page = readPage(searchParams.get('page'))

  const [searchInput, setSearchInput] = useState(search)
  const debouncedSearch = useDebouncedValue(searchInput.trim())
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const updateParams = useCallback(
    (next) =>
      setSearchParams(
        (current) => {
          const params = new URLSearchParams(current)
          Object.entries(next).forEach(([key, value]) => {
            if (value && !(key === 'page' && value === 1)) params.set(key, value)
            else params.delete(key)
          })
          return params
        },
        { replace: true },
      ),
    [setSearchParams],
  )

  const searchSettled = debouncedSearch === searchInput.trim()

  useEffect(() => {
    if (searchSettled && debouncedSearch !== search) updateParams({ search: debouncedSearch, page: 1 })
  }, [searchSettled, debouncedSearch, search, updateParams])

  const fetchPatients = useCallback(() => getPatients({ search, page, limit: PAGE_SIZE }), [search, page])
  const { data, error, loading, reload } = useApi(fetchPatients)
  const patients = data?.patients
  const meta = data?.meta

  useEffect(() => {
    if (meta && meta.totalPages > 0 && meta.page > meta.totalPages) updateParams({ page: meta.totalPages })
  }, [meta, updateParams])

  const clearSearch = () => {
    setSearchInput('')
    updateParams({ search: '', page: 1 })
  }

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await deletePatient(toDelete.id)
      notify.success(`Le dossier de ${toDelete.full_name} a été supprimé.`)
      setToDelete(null)
      if (patients.length === 1 && page > 1) updateParams({ page: page - 1 })
      else reload()
    } catch (err) {
      notify.error(err)
    } finally {
      setDeleting(false)
    }
  }

  const showSkeleton = loading && !patients

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <section aria-labelledby="patients-title" className="flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-4 shadow-sm lg:flex-row lg:items-end lg:justify-between lg:p-6">
        <div className="flex flex-col gap-1">
          <h1 id="patients-title" className="text-headline-sm font-semibold lg:text-headline-md">Dossiers patients</h1>
          <p className="text-body-sm text-on-surface-variant lg:text-body-md">
            {meta
              ? search
                ? `${plural(meta.total, 'résultat')} pour « ${search} »`
                : `${plural(meta.total, 'patient enregistré', 'patients enregistrés')}`
              : 'Recherchez un patient par son nom ou son CIN.'}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row lg:w-auto">
          <div className="relative flex flex-1 items-center lg:w-80 lg:flex-none">
            <Icon name="search" className="pointer-events-none absolute left-3 text-[20px] text-on-surface-variant" />
            <label htmlFor="patient-search" className="sr-only">Rechercher un patient</label>
            <input
              id="patient-search"
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Nom ou CIN"
              autoComplete="off"
              className="h-11 w-full rounded-lg bg-surface-container-low pr-10 pl-10 text-body-md text-on-surface ring-1 ring-inset ring-outline-variant/50 placeholder:text-on-surface-variant focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {searchInput && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Effacer la recherche"
                className="absolute right-1 flex size-9 items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-primary"
              >
                <Icon name="close" className="text-[18px]" />
              </button>
            )}
          </div>
          <Link
            to="/patients/new"
            className="flex h-11 items-center justify-center gap-1 whitespace-nowrap rounded-lg bg-primary px-4 text-label-lg font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-container active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Icon name="person_add" className="text-[20px]" />
            Ajouter patient
          </Link>
        </div>
      </section>

      {error && (
        <div className="flex flex-col gap-2">
          <Alert>{patients ? `Actualisation impossible. ${error.message}` : error.message}</Alert>
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

      {showSkeleton && <ListSkeleton />}

      {patients && patients.length === 0 && !loading && <EmptyState search={search} onClear={clearSearch} />}

      {patients && patients.length > 0 && (
        <div aria-busy={loading} className={`flex flex-col gap-4 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          <ul className="flex flex-col gap-2 lg:hidden">
            {patients.map((patient) => (
              <li key={patient.id}>
                <PatientCard patient={patient} canDelete={canDelete} onDelete={setToDelete} />
              </li>
            ))}
          </ul>

          <div className="hidden overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm lg:block">
            <table className="w-full table-fixed text-left">
              <caption className="sr-only">Liste des patients</caption>
              <thead className="bg-surface-container-low text-label-md text-on-surface-variant">
                <tr>
                  <th scope="col" className="w-[36%] py-3 pr-4 pl-6 font-semibold">Patient</th>
                  <th scope="col" className="px-4 py-3 font-semibold">CIN</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Téléphone</th>
                  <th scope="col" className="w-[22%] px-4 py-3 font-semibold">Date de naissance</th>
                  <th scope="col" className="w-28 py-3 pr-6 pl-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <PatientRow key={patient.id} patient={patient} canDelete={canDelete} onDelete={setToDelete} />
                ))}
              </tbody>
            </table>
          </div>

          {meta && (
            <Pagination meta={meta} disabled={loading} onChange={(next) => updateParams({ page: next })} />
          )}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Supprimer ce dossier ?"
        confirmLabel="Supprimer"
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => !deleting && setToDelete(null)}
      >
        {toDelete && (
          <p>
            Le dossier de <strong className="font-semibold text-on-surface">{toDelete.full_name}</strong> (CIN {toDelete.cin}) et
            ses rendez-vous ne seront plus visibles dans ClinicFlow.
          </p>
        )}
      </ConfirmDialog>
    </div>
  )
}

export default PatientsPage
