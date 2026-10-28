import Icon from './Icon'

const VARIANTS = {
  error: { icon: 'error', className: 'bg-error-container text-on-error-container', role: 'alert' },
  success: { icon: 'check_circle', className: 'bg-secondary-container text-on-secondary-container', role: 'status' },
  info: { icon: 'info', className: 'bg-surface-container-high text-on-primary-fixed', role: 'status' },
}

const Alert = ({ variant = 'error', children, className = '' }) => {
  const { icon, className: variantClass, role } = VARIANTS[variant]

  return (
    <div role={role} className={`flex items-start gap-2 rounded-lg p-3 text-body-sm shadow-sm ${variantClass} ${className}`}>
      <Icon name={icon} className="text-[18px]" />
      <p className="pt-px">{children}</p>
    </div>
  )
}

export default Alert
