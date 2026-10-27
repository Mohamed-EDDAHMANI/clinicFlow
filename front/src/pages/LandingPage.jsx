import { Link } from 'react-router'
import Button from '../components/Button'

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 gap-6">
      <h1 className="text-4xl font-bold text-gray-800 tracking-tight">
        Welcome to Simo App
      </h1>
      <div className="flex gap-3">
        <Link to="/login"><Button>Login</Button></Link>
        <Link to="/register">
          <Button className="bg-gray-700 hover:bg-gray-800">Register</Button>
        </Link>
      </div>
    </div>
  )
}

export default LandingPage
