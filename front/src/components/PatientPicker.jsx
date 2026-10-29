import { useCallback, useState } from 'react'
import { ArrowLeftRight, Search } from 'lucide-react'
import { getPatients } from '../api/patientService'
import { useApi } from '../hooks/useApi'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useOverlay } from '../hooks/useOverlay'
import Avatar from './Avatar'

const PatientPicker = ({ id, value, onChange, invalid, describedBy, limit = 6 }) => {
  const { open } = useOverlay()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search.trim())

  const fetchPatients = useCallback(() => getPatients({ search: debouncedSearch, limit }), [debouncedSearch, limit])
  const { data, error, loading } = useApi(fetchPatients, { enabled: !value })
  const patients = data?.patients

  if (value) {
    return (
      <div className="picker-selected">
        <Avatar name={value.full_name} seed={value.id} />
        <div className="who">
          <b>{value.full_name}</b>
          <small>CIN : {value.cin}</small>
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => onChange(null)}>
          <ArrowLeftRight aria-hidden="true" />
          Changer
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="searchbox w-full!">
        <Search aria-hidden="true" />
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
        />
      </div>

      <div id={`${id}-results`} aria-live="polite" className="picker-list">
        {error && <p className="sp-empty text-(--danger)!">{error.message}</p>}
        {!error && loading && !patients && <p className="sp-empty">Recherche des patients…</p>}
        {!error && patients?.length === 0 && (
          <p className="sp-empty">
            Aucun patient trouvé.{' '}
            <button type="button" onClick={() => open('new-patient')} className="link-btn">Créer un dossier</button>
          </p>
        )}
        {patients?.map((patient) => (
          <button
            key={patient.id}
            type="button"
            onClick={() => onChange(patient)}
            className={`sp-item ${loading ? 'opacity-60' : ''}`}
          >
            <Avatar name={patient.full_name} seed={patient.id} />
            <div className="min-w-0 flex-1">
              <b className="truncate">{patient.full_name}</b>
              <small>CIN : {patient.cin}</small>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default PatientPicker
