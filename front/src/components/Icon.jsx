const Icon = ({ name, filled = false, className = '' }) => (
  <span
    aria-hidden="true"
    className={`material-symbols-outlined select-none leading-none ${className}`}
    style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
  >
    {name}
  </span>
)

export default Icon
