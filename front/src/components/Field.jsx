import { CircleAlert } from 'lucide-react'

const Field = ({ id, label, icon: LeadIcon, error, hint, className = '', children }) => (
  <div className={`field ${className}`}>
    <label htmlFor={id}>{label}</label>
    <div className="field-control">
      {LeadIcon && <LeadIcon aria-hidden="true" className="lead-icn" />}
      {children}
    </div>
    {hint && !error && <p id={`${id}-hint`} className="hint">{hint}</p>}
    {error && (
      <p id={`${id}-error`} className="err">
        <CircleAlert aria-hidden="true" />
        {error.message}
      </p>
    )}
  </div>
)

export default Field
