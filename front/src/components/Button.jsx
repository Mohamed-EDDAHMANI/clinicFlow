const Button = ({ children, className = '', ...props }) => {
  return (
    <button
      className={`px-4 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
