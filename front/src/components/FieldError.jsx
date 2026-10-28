import Icon from './Icon'

const FieldError = ({ id, error }) => {
  if (!error) return null

  return (
    <p id={id} className="flex items-center gap-1 text-body-sm text-error">
      <Icon name="error" className="text-[16px]" />
      {error.message}
    </p>
  )
}

export default FieldError
