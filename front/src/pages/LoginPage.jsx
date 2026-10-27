import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router'
import { loginSchema } from '../schemas/authSchema'
import { setUser } from '../features/authSlice'
import { login } from '../api/authService'
import Card from '../components/Card'
import Input from '../components/Input'
import Button from '../components/Button'

const LoginPage = () => {
  const dispatch = useDispatch()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (values) => {
    try {
      const data = await login(values.email, values.password)
      dispatch(setUser(data))
    } catch (err) {
      setError('root', { message: err.message })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <Card className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-6">Login</h1>

        {errors.root && (
          <p className="text-red-600 text-sm mb-4">{errors.root.message}</p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input type="email" {...register('email')} />
            {errors.email && (
              <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <Input type="password" {...register('password')} />
            {errors.password && (
              <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Loading...' : 'Login'}
          </Button>
        </form>

        <p className="text-sm text-center mt-4">
          No account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline">Register</Link>
        </p>
      </Card>
    </div>
  )
}

export default LoginPage
