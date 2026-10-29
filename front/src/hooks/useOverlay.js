import { useCallback } from 'react'
import { useSearchParams } from 'react-router'

const MODAL_KEYS = { modal: null, id: null, date: null, time: null }

export const useOverlay = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const update = useCallback(
    (changes, options) =>
      setSearchParams((current) => {
        const next = new URLSearchParams(current)
        Object.entries(changes).forEach(([key, value]) => {
          if (value) next.set(key, value)
          else next.delete(key)
        })
        return next
      }, options),
    [setSearchParams],
  )

  const open = useCallback((modal, params = {}) => update({ ...MODAL_KEYS, modal, ...params }), [update])
  const close = useCallback((changes = {}) => update({ ...MODAL_KEYS, ...changes }, { replace: true }), [update])
  const openPatient = useCallback((id) => update({ fiche: id }), [update])
  const closePatient = useCallback(() => update({ fiche: null }, { replace: true }), [update])

  return {
    modal: searchParams.get('modal'),
    modalId: searchParams.get('id'),
    modalDate: searchParams.get('date'),
    modalTime: searchParams.get('time'),
    patientId: searchParams.get('fiche'),
    open,
    close,
    openPatient,
    closePatient,
  }
}
