import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useDispatch } from 'react-redux'
import { loginSchema } from '../schemas/authSchema'
import { setUser } from '../features/authSlice'
import { login } from '../api/authService'
import Icon from '../components/Icon'

const API_ERRORS = {
  'Invalid email or password': 'Email ou mot de passe incorrect.',
  'Too many login attempts, please try again in 15 minutes': 'Trop de tentatives. Réessayez dans 15 minutes.',
}

const NETWORK_ERROR = 'Le serveur est injoignable. Vérifiez votre connexion puis réessayez.'

const toFrenchError = (err) => {
  if (err instanceof TypeError) return NETWORK_ERROR
  return API_ERRORS[err.message] ?? err.message
}

const fieldClass =
  'w-full h-11 pl-10 rounded-lg bg-surface-container-lowest text-on-surface text-body-md shadow-sm ' +
  'ring-1 ring-inset ring-outline-variant/70 placeholder:text-on-surface-variant ' +
  'focus:outline-none focus:bg-surface-container-low focus:ring-2 focus:ring-primary transition-colors ' +
  'aria-[invalid=true]:ring-error'

const FieldError = ({ id, children }) => (
  <p id={id} className="flex items-center gap-1 text-body-sm text-error">
    <Icon name="error" className="text-[16px]" />
    {children}
  </p>
)

const LoginPage = () => {
  const dispatch = useDispatch()
  const [showPassword, setShowPassword] = useState(false)
  const [capsLock, setCapsLock] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (values) => {
    try {
      const { data } = await login(values.email, values.password)
      dispatch(setUser(data))
    } catch (err) {
      setError('root', { message: toFrenchError(err) })
    }
  }

  const trackCapsLock = (event) => setCapsLock(event.getModifierState('CapsLock'))

  const passwordHints = [errors.password && 'password-error', capsLock && 'password-caps'].filter(Boolean).join(' ')

  return (
    <div className="min-h-dvh bg-surface pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <main className="mx-auto w-full max-w-md px-4 pt-6 pb-8 lg:max-w-5xl lg:min-h-dvh lg:grid lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-12">
        <header className="flex flex-col items-center text-center mt-4 mb-6 lg:items-start lg:text-left lg:m-0">
          <p className="inline-flex items-center gap-1 rounded-full bg-surface-container-high px-4 py-1 text-primary shadow-sm mb-4">
            <Icon name="local_hospital" filled className="text-[18px]" />
            <span className="text-label-sm font-semibold uppercase tracking-wider">Portail médical sécurisé</span>
          </p>

          <div className="flex items-center gap-2 mb-1">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-on-primary shadow-md lg:size-12">
              <Icon name="health_and_safety" className="text-[24px] lg:text-[28px]" />
            </span>
            <h1 className="text-headline-lg-mobile font-semibold tracking-tight lg:text-headline-lg">ClinicFlow</h1>
          </div>

          <h2 className="text-headline-sm font-semibold mt-1 lg:text-headline-md lg:mt-6">Bienvenue sur ClinicFlow</h2>
          <p className="text-body-sm text-on-surface-variant max-w-xs mt-1 leading-relaxed lg:text-body-lg lg:max-w-sm lg:mt-2">
            Connectez-vous pour accéder aux dossiers patients et au planning des rendez-vous.
          </p>
        </header>

        <section className="rounded-xl bg-surface-container-lowest p-6 shadow-sm lg:p-8">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            {errors.root && (
              <p role="alert" className="flex items-start gap-2 rounded-lg bg-error-container p-2 text-label-md text-on-error-container shadow-sm">
                <Icon name="error" className="text-[18px]" />
                <span className="pt-px">{errors.root.message}</span>
              </p>
            )}

            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-label-md font-medium">Adresse email professionnelle</label>
              <div className="relative flex items-center">
                <Icon name="mail" className="absolute left-3 text-[20px] text-on-surface-variant" />
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  placeholder="ex : nom@clinique.ma"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  className={`${fieldClass} pr-4`}
                  {...register('email')}
                />
              </div>
              {errors.email && <FieldError id="email-error">{errors.email.message}</FieldError>}
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-label-md font-medium">Mot de passe</label>
              <div className="relative flex items-center">
                <Icon name="lock" className="absolute left-3 text-[20px] text-on-surface-variant" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Votre mot de passe"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={passwordHints || undefined}
                  onKeyUp={trackCapsLock}
                  onKeyDown={trackCapsLock}
                  className={`${fieldClass} pr-11`}
                  {...register('password', { onBlur: () => setCapsLock(false) })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((shown) => !shown)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  aria-pressed={showPassword}
                  aria-controls="password"
                  className="absolute right-2 flex size-8 items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} className="text-[20px]" />
                </button>
              </div>
              {capsLock && (
                <p id="password-caps" className="flex items-center gap-1 text-body-sm text-on-surface-variant">
                  <Icon name="keyboard_capslock" className="text-[16px]" />
                  La touche Verr. Maj est activée.
                </p>
              )}
              {errors.password && <FieldError id="password-error">{errors.password.message}</FieldError>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-label-lg font-semibold text-on-primary shadow-md transition-colors hover:bg-primary-container active:scale-[0.99] disabled:cursor-wait disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Icon
                name={isSubmitting ? 'progress_activity' : 'login'}
                className={`text-[20px] ${isSubmitting ? 'motion-safe:animate-spin' : ''}`}
              />
              {isSubmitting ? 'Connexion…' : 'Se connecter'}
            </button>

            <p className="text-center text-body-sm text-on-surface-variant">
              Pas encore de compte ? Demandez à votre administrateur de vous en créer un.
            </p>
          </form>
        </section>
      </main>
    </div>
  )
}

export default LoginPage
