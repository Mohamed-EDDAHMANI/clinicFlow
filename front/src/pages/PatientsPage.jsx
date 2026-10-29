import { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router'
import { CalendarPlus, ChevronLeft, ChevronRight, Download, Ellipsis, LoaderCircle, Pencil, Plus, Search, SearchX, Trash2, UserPlus, X } from 'lucide-react'
import { deletePatient, getPatients } from '../api/patientService'
import { ROLES } from '../config/roles'
import { dataChanged } from '../features/refreshSlice'
import { useApi } from '../hooks/useApi'
import { useNotify } from '../hooks/useNotify'
import { useOverlay } from '../hooks/useOverlay'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { exportPatients } from '../utils/exportPatients'
import { ageFrom, formatCount, formatShortDate, formatTimestamp, plural } from '../utils/format'
import Alert from '../components/Alert'
import Avatar from '../components/Avatar'
import ConfirmDialog from '../components/ConfirmDialog'

const PAGE_SIZE = 10

const readPage = (value) => {
  const page = Number.parseInt(value, 10)
  return Number.isInteger(page) && page > 0 ? page : 1
}

const pageItems = (current, total) => {
  const pages = new Set([1, total, current - 1, current, current + 1])
  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b)
  return sorted.flatMap((page, index) => (index > 0 && page - sorted[index - 1] > 1 ? ['gap', page] : [page]))
}

const Pager = ({ meta, disabled, onChange }) => (
  <nav className="pager" aria-label="Pagination">
    <button type="button" className="pg-btn" onClick={() => onChange(meta.page - 1)} disabled={disabled || meta.page <= 1} aria-label="Page précédente">
      <ChevronLeft aria-hidden="true" />
    </button>
    {pageItems(meta.page, meta.totalPages).map((item, index) =>
      item === 'gap' ? (
        <span key={`gap-${index}`} className="pg-gap">…</span>
      ) : (
        <button
          key={item}
          type="button"
          className={`pg-btn ${item === meta.page ? 'current' : ''}`}
          onClick={() => onChange(item)}
          disabled={disabled || item === meta.page}
          aria-current={item === meta.page ? 'page' : undefined}
        >
          {item}
        </button>
      ),
    )}
    <button type="button" className="pg-btn" onClick={() => onChange(meta.page + 1)} disabled={disabled || meta.page >= meta.totalPages} aria-label="Page suivante">
      <ChevronRight aria-hidden="true" />
    </button>
  </nav>
)

const RowSkeleton = () =>
  [0, 1, 2, 3, 4].map((row) => (
    <tr key={row} aria-hidden="true">
      <td>
        <div className="p-cell">
          <span className="skeleton size-9 rounded-full!" />
          <div className="flex flex-col gap-1.5">
            <span className="skeleton h-3.5 w-36" />
            <span className="skeleton h-3 w-24" />
          </div>
        </div>
      </td>
      {[0, 1, 2, 3].map((cell) => (
        <td key={cell}><span className="skeleton h-3.5 w-20" /></td>
      ))}
      <td />
    </tr>
  ))

const PatientsPage = () => {
  const dispatch = useDispatch()
  const notify = useNotify()
  const { open, openPatient } = useOverlay()
  const canDelete = useSelector((state) => state.auth.user?.role === ROLES.ADMIN)
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('search') ?? ''
  const page = readPage(searchParams.get('page'))

  const [searchInput, setSearchInput] = useState(search)
  const debouncedSearch = useDebouncedValue(searchInput.trim())
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)

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
      dispatch(dataChanged())
    } catch (err) {
      notify.error(err)
    } finally {
      setDeleting(false)
    }
  }

  const runExport = async () => {
    setExporting(true)
    try {
      const count = await exportPatients(search)
      notify.success(`Export CSV téléchargé (${plural(count, 'patient')}).`)
    } catch (err) {
      notify.error(err)
    } finally {
      setExporting(false)
    }
  }

  const stop = (handler) => (event) => {
    event.stopPropagation()
    handler()
  }

  const from = meta && meta.total ? (meta.page - 1) * meta.limit + 1 : 0
  const to = meta ? Math.min(meta.page * meta.limit, meta.total) : 0

  return (
    <>
      <div className="page-head stagger">
        <div>
          <div className="eyebrow">Répertoire clinique</div>
          <h1 className="page-title">
            Tous les patients
            {meta && !search && <span className="chip chip-brand">{formatCount(meta.total)}</span>}
          </h1>
          <p className="page-sub">Consultez et gérez les dossiers patients. Cliquez sur une ligne pour ouvrir la fiche.</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-outline" onClick={runExport} disabled={exporting || meta?.total === 0}>
            {exporting ? <LoaderCircle aria-hidden="true" className="spin" /> : <Download aria-hidden="true" />}
            Exporter
          </button>
          <button type="button" className="btn btn-primary" onClick={() => open('new-patient')}>
            <Plus aria-hidden="true" />
            Ajouter un patient
          </button>
        </div>
      </div>

      <div className="card patients-card page-fill stagger">
        <div className="patients-body">
          <div className="toolbar">
            <div className="searchbox">
              <Search aria-hidden="true" />
              <label htmlFor="patient-search" className="sr-only">Rechercher un patient</label>
              <input
                id="patient-search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Nom ou CIN…"
                autoComplete="off"
              />
              {searchInput && (
                <button type="button" className="clear" onClick={clearSearch} aria-label="Effacer la recherche">
                  <X aria-hidden="true" />
                </button>
              )}
            </div>
            <div className="sp" />
            {meta && (
              <span className="chip chip-neutral" aria-live="polite">
                {search ? `${plural(meta.total, 'résultat')} pour « ${search} »` : plural(meta.total, 'patient')}
              </span>
            )}
          </div>

          {error && (
            <div className="p-4">
              <Alert action={<button type="button" className="link-btn" onClick={reload}>Réessayer</button>}>
                {patients ? `Actualisation impossible. ${error.message}` : error.message}
              </Alert>
            </div>
          )}

          {patients?.length === 0 && !loading ? (
            <div className="empty">
              <span className="empty-icn">{search ? <SearchX aria-hidden="true" /> : <UserPlus aria-hidden="true" />}</span>
              {search ? (
                <>
                  <b>Aucun patient ne correspond à « {search} »</b>
                  <p>Vérifiez l'orthographe du nom ou le numéro de CIN.</p>
                  <button type="button" className="btn btn-outline mt-2" onClick={clearSearch}>
                    <X aria-hidden="true" />
                    Effacer la recherche
                  </button>
                </>
              ) : (
                <>
                  <b>Aucun patient enregistré</b>
                  <p>Ajoutez un premier dossier pour pouvoir planifier ses rendez-vous.</p>
                  <button type="button" className="btn btn-primary mt-2" onClick={() => open('new-patient')}>
                    <Plus aria-hidden="true" />
                    Ajouter un patient
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="table-wrap">
              <table className={`table transition-opacity ${loading && patients ? 'opacity-60' : ''}`} aria-busy={loading}>
                <caption className="sr-only">Liste des patients</caption>
                <thead>
                  <tr>
                    <th scope="col" className="w-[32%]">Patient</th>
                    <th scope="col">CIN</th>
                    <th scope="col">Téléphone</th>
                    <th scope="col">Date de naissance</th>
                    <th scope="col">Ajouté le</th>
                    <th scope="col" className="w-36"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {!patients && <RowSkeleton />}
                  {patients?.map((patient) => (
                    <tr
                      key={patient.id}
                      className="clickable"
                      tabIndex={0}
                      onClick={() => openPatient(patient.id)}
                      onKeyDown={(event) => {
                        if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                          event.preventDefault()
                          openPatient(patient.id)
                        }
                      }}
                      aria-label={`Ouvrir la fiche de ${patient.full_name}`}
                    >
                      <td>
                        <div className="p-cell">
                          <Avatar name={patient.full_name} seed={patient.id} />
                          <div className="min-w-0">
                            <b>{patient.full_name}</b>
                            <small>{patient.address || 'Adresse non renseignée'}</small>
                          </div>
                        </div>
                      </td>
                      <td className="num font-medium text-(--ink)">{patient.cin}</td>
                      <td className="num">
                        <a href={`tel:${patient.phone}`} onClick={(event) => event.stopPropagation()} className="hover:text-(--brand-600) hover:underline">
                          {patient.phone}
                        </a>
                      </td>
                      <td>
                        {formatShortDate(patient.birth_date)}
                        <span className="muted"> · {ageFrom(patient.birth_date)} ans</span>
                      </td>
                      <td className="muted">{formatTimestamp(patient.created_at)}</td>
                      <td>
                        <div className="row-actions">
                          <button type="button" className="icon-btn sm" onClick={stop(() => open('new-appointment', { id: patient.id }))} aria-label={`Planifier un rendez-vous pour ${patient.full_name}`} title="Planifier un RDV">
                            <CalendarPlus aria-hidden="true" />
                          </button>
                          <button type="button" className="icon-btn sm" onClick={stop(() => open('edit-patient', { id: patient.id }))} aria-label={`Modifier ${patient.full_name}`} title="Modifier">
                            <Pencil aria-hidden="true" />
                          </button>
                          {canDelete && (
                            <button type="button" className="icon-btn sm danger" onClick={stop(() => setToDelete(patient))} aria-label={`Supprimer ${patient.full_name}`} title="Supprimer">
                              <Trash2 aria-hidden="true" />
                            </button>
                          )}
                          <button type="button" className="icon-btn sm" onClick={stop(() => openPatient(patient.id))} aria-label={`Fiche de ${patient.full_name}`} title="Fiche patient">
                            <Ellipsis aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {meta && meta.total > 0 && (
            <div className="table-foot">
              <small>
                Affichage de <b>{from}–{to}</b> sur <b>{formatCount(meta.total)}</b> patients
              </small>
              {meta.totalPages > 1 && <Pager meta={meta} disabled={loading} onChange={(next) => updateParams({ page: next })} />}
            </div>
          )}
        </div>
      </div>

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
            Le dossier de <strong className="text-(--ink)">{toDelete.full_name}</strong> (CIN {toDelete.cin}) et ses rendez-vous ne seront plus visibles dans ClinicFlow.
          </p>
        )}
      </ConfirmDialog>
    </>
  )
}

export default PatientsPage
