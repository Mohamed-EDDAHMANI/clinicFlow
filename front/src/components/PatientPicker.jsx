import { useCallback, useState } from 'react'
import { Link } from 'react-router'
import { getPatients } from '../api/patientService'
import { useApi } from '../hooks/useApi'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { initials } from '../utils/format'
import Icon from './Icon'

const RESULTS_LIMIT = 6

const PatientPicker = ({ id, value, onChange, invalid, describedBy }) => {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search.trim())

  const fetchPatients = useCallback(() => getPatients({ search: debouncedSearch, limit: RESULTS_LIMIT }), [debouncedSearch])
  const { data, error, loading } = useApi(fetchPatients, { enabled: !value })
  const patients = data?.patients

  if (value) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg bg-surface-container-low p-2 ring-1 ring-inset ring-primary/40">
        <div className="flex min-w-0 items-center gap-2">
          <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-label-lg text-on-primary-fixed">
            {initials(value.full_name)}
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-label-lg font-semibold">{value.full_name}</span>
            <span className="truncate text-body-sm text-on-surface-variant">CIN : {value.cin}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="flex h-10 shrink-0 items-center gap-1 rounded-lg px-3 text-label-md font-semibold text-primary hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-primary"
        >
          <Icon name="swap_horiz" className="text-[18px]" />
          Changer
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative flex items-center">
        <Icon name="search" className="pointer-events-none absolute left-3 text-[20px] text-on-surface-variant" />
        <input
          id={id}
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher par nom ou CIN"
          autoComplete="off"
          aria-invalid={invalid}
          aria-describedby={describedBy}
          aria-controls={`${id}-results`}
          className="h-11 w-full rounded-lg bg-surface-container-lowest pr-4 pl-10 text-body-md text-on-surface shadow-sm ring-1 ring-inset ring-outline-variant/70 placeholder:text-on-surface-variant focus:bg-surface-container-low focus:ring-2 focus:ring-primary focus:outline-none aria-[invalid=true]:ring-error [&::-webkit-search-cancel-button]:hidden"
        />
      </div>

      <div id={`${id}-results`} aria-live="polite" className="overflow-hidden rounded-lg ring-1 ring-inset ring-outline-variant/50">
        {error && <p className="p-3 text-body-sm text-error">{error.message}</p>}
        {!error && loading && !patients && <p className="p-3 text-body-sm text-on-surface-variant">Recherche des patients…</p>}
        {!error && patients?.length === 0 && (
          <p className="p-3 text-body-sm text-on-surface-variant">
            Aucun patient trouvé.{' '}
            <Link to="/patients/new" className="font-semibold text-primary hover:underline">Créer un dossier</Link>
          </p>
        )}
        {patients?.length > 0 && (
          <ul className={`divide-y divide-surface-container transition-opacity ${loading ? 'opacity-60' : ''}`}>
            {patients.map((patient) => (
              <li key={patient.id}>
                <button
                  type="button"
                  onClick={() => onChange(patient)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-surface-container-low focus-visible:bg-surface-container-low focus-visible:outline-none"
                >
                  <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-label-sm text-on-primary-fixed">
                    {initials(patient.full_name)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-label-lg font-semibold">{patient.full_name}</span>
                  <span className="shrink-0 text-body-sm text-on-surface-variant tabular-nums">{patient.cin}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default PatientPicker
