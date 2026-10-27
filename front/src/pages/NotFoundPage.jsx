import { Link } from 'react-router'

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 gap-4">
      <h1 className="text-6xl font-bold text-gray-800 tracking-tight">404</h1>
      <p className="text-xl text-gray-700">Page Not Found</p>
      <Link to="/" className="text-blue-700 hover:underline">
        Back to Home
      </Link>
    </div>
  )
}

export default NotFoundPage
