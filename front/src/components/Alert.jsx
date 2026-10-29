import { CircleAlert, CircleCheck, Info } from 'lucide-react'

const VARIANTS = {
  error: { icon: CircleAlert, role: 'alert' },
  success: { icon: CircleCheck, role: 'status' },
  info: { icon: Info, role: 'status' },
}

const Alert = ({ variant = 'error', children, action, className = '' }) => {
  const { icon: VariantIcon, role } = VARIANTS[variant]

  return (
    <div role={role} className={`alert alert-${variant} ${className}`}>
      <VariantIcon aria-hidden="true" />
      <p className="flex-1">{children}</p>
      {action}
    </div>
  )
}

export default Alert
