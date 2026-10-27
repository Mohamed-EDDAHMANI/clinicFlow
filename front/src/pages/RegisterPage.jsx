import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router'
import { registerSchema } from '../schemas/authSchema'
import { register as registerUser } from '../api/authService'
import Card from '../components/Card'
import Input from '../components/Input'
import Button from '../components/Button'

const RegisterPage = () => {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(registerSchema) })

  const onSubmit = async (values) => {
    try {
      await registerUser(values)
      navigate('/login')
    } catch (err) {
      setError('root', { message: err.message })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <Card className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-6">Register</h1>

        {errors.root && (
          <p className="text-red-600 text-sm mb-4">{errors.root.message}</p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input type="text" {...register('name')} />
            {errors.name && (
              <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

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
            {isSubmitting ? 'Loading...' : 'Register'}
          </Button>
        </form>

        <p className="text-sm text-center mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
        </p>
      </Card>
    </div>
  )
}

export default RegisterPage
