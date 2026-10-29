import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useDispatch } from 'react-redux'
import { Activity, ArrowRight, Eye, EyeOff, Keyboard, LoaderCircle, Lock, Mail, Stethoscope } from 'lucide-react'
import { loginSchema } from '../schemas/authSchema'
import { setUser } from '../features/authSlice'
import { login } from '../api/authService'
import { useNotify } from '../hooks/useNotify'
import { applyApiError } from '../utils/formErrors'
import { fieldProps } from '../utils/fieldProps'
import { clinicToday, firstName } from '../utils/format'
import Alert from '../components/Alert'
import Field from '../components/Field'

const HIGHLIGHTS = [
  { value: '30 min', label: 'contrôle des créneaux' },
  { value: '2 rôles', label: 'admin & personnel' },
  { value: 'JWT', label: 'sessions sécurisées' },
]

const LoginPage = () => {
  const dispatch = useDispatch()
  const notify = useNotify()
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
      notify.success(`Bon retour, ${firstName(data.user.full_name)} 👋`)
    } catch (error) {
      applyApiError(error, setError, ['email', 'password'])
    }
  }

  const trackCapsLock = (event) => setCapsLock(event.getModifierState('CapsLock'))
  const passwordDescription = [errors.password && 'password-error', capsLock && 'password-caps'].filter(Boolean).join(' ')

  return (
    <div className="login">
      <section className="login-brand" aria-hidden="true">
        <div className="glow" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="ecg-wrap">
          <svg viewBox="0 0 560 90" preserveAspectRatio="none">
            <path className="ecg-path" d="M0 45 H150 L168 45 L178 18 L190 72 L200 45 H300 L315 45 L325 30 L335 60 L345 45 H560" />
          </svg>
        </div>

        <div className="lb-head">
          <span className="logo-tile"><Activity /></span>
          <span className="logo-text">ClinicFlow</span>
        </div>

        <div className="lb-mid">
          <div className="lb-icon"><Stethoscope /></div>
          <div className="eyebrow">Le cockpit de votre clinique</div>
          <h1>Plus de temps<br />pour vos <em>patients.</em></h1>
          <p>Centralisez vos rendez-vous, vos dossiers patients et votre équipe dans un espace simple, serein et sécurisé.</p>
          <div className="lb-stats">
            {HIGHLIGHTS.map((item) => (
              <div key={item.label}>
                <b>{item.value}</b>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lb-foot">© {clinicToday().slice(0, 4)} ClinicFlow · Gestion clinique simplifiée</div>
      </section>

      <main className="login-form">
        <div className="login-card">
          <div className="login-mobile-logo">
            <span className="logo-tile"><Activity aria-hidden="true" /></span>
            <span className="logo-text">ClinicFlow</span>
          </div>

          <div className="eyebrow">Bienvenue</div>
          <h2>Ravi de vous revoir.</h2>
          <p className="sub">Connectez-vous à votre espace ClinicFlow.</p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {errors.root && <Alert>{errors.root.message}</Alert>}

            <Field id="email" label="Adresse email" icon={Mail} error={errors.email}>
              <input
                className="input"
                type="email"
                autoComplete="username"
                placeholder="vous@clinique.ma"
                {...fieldProps('email', errors.email)}
                {...register('email')}
              />
            </Field>

            <div>
              <Field id="password" label="Mot de passe" icon={Lock} error={errors.password}>
                <input
                  className="input pr-11!"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  id="password"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={passwordDescription || undefined}
                  onKeyUp={trackCapsLock}
                  onKeyDown={trackCapsLock}
                  {...register('password', { onBlur: () => setCapsLock(false) })}
                />
                <button
                  type="button"
                  className="pw-toggle"
                  onClick={() => setShowPassword((shown) => !shown)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  aria-pressed={showPassword}
                  aria-controls="password"
                >
                  {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </button>
              </Field>
              {capsLock && (
                <p id="password-caps" className="caps-hint">
                  <Keyboard aria-hidden="true" />
                  La touche Verr. Maj est activée.
                </p>
              )}
            </div>

            <button className="btn btn-primary btn-block" type="submit" disabled={isSubmitting}>
              {isSubmitting && <LoaderCircle aria-hidden="true" className="spin" />}
              <span>{isSubmitting ? 'Connexion…' : 'Se connecter'}</span>
              {!isSubmitting && <ArrowRight aria-hidden="true" />}
            </button>
          </form>

          <p className="login-help">Pas encore de compte ? Demandez à votre administrateur de vous en créer un.</p>
        </div>
      </main>
    </div>
  )
}

export default LoginPage
