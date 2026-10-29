import { useCallback, useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { getPatients } from '../api/patientService'
import { useApi } from '../hooks/useApi'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import Avatar from './Avatar'

const RESULTS_LIMIT = 5
const MIN_LENGTH = 2

const isTyping = (element) => ['INPUT', 'TEXTAREA', 'SELECT'].includes(element?.tagName) || element?.isContentEditable

const GlobalSearch = ({ onSelect }) => {
  const inputRef = useRef(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const term = useDebouncedValue(query.trim())
  const active = open && term.length >= MIN_LENGTH

  const fetchResults = useCallback(() => getPatients({ search: term, limit: RESULTS_LIMIT }), [term])
  const { data, loading, error } = useApi(fetchResults, { enabled: active })
  const patients = data?.patients

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === '/' && !isTyping(document.activeElement)) {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const choose = (patient) => {
    setQuery('')
    setOpen(false)
    inputRef.current?.blur()
    onSelect(patient)
  }

  return (
    <div
      className="searchbox"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
    >
      <Search aria-hidden="true" />
      <label htmlFor="global-search" className="sr-only">Rechercher un patient</label>
      <input
        ref={inputRef}
        id="global-search"
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setOpen(false)
            event.currentTarget.blur()
          }
          if (event.key === 'Enter' && patients?.length) choose(patients[0])
        }}
        placeholder="Rechercher un patient (nom, CIN)…"
        autoComplete="off"
        aria-controls="global-search-results"
      />
      {query ? (
        <button type="button" className="clear" onClick={() => setQuery('')} aria-label="Effacer la recherche">
          <X aria-hidden="true" />
        </button>
      ) : (
        <kbd aria-hidden="true">/</kbd>
      )}

      {active && (
        <div id="global-search-results" className="search-pop" aria-live="polite">
          {error && <div className="sp-empty">{error.message}</div>}
          {!error && !patients && loading && <div className="sp-empty">Recherche…</div>}
          {!error && patients?.length === 0 && <div className="sp-empty">Aucun résultat pour « {term} »</div>}
          {patients?.map((patient) => (
            <button key={patient.id} type="button" className={`sp-item ${loading ? 'opacity-60' : ''}`} onClick={() => choose(patient)}>
              <Avatar name={patient.full_name} seed={patient.id} />
              <div className="min-w-0">
                <b className="truncate">{patient.full_name}</b>
                <small>Patient · CIN {patient.cin}</small>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default GlobalSearch
