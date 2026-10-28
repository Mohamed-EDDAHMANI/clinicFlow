import { ApiError, errorMessage } from '../api/apiError'

export const applyApiError = (error, setError, fields = []) => {
  if (error instanceof ApiError) {
    const fieldErrors = error.errors.filter(({ field }) => fields.includes(field))
    fieldErrors.forEach(({ field, message }) => setError(field, { message }))

    if (error.field && fields.includes(error.field)) {
      setError(error.field, { message: error.message })
      return
    }

    if (fieldErrors.length) return
  }

  setError('root', { message: errorMessage(error) })
}
