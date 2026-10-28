import { Link } from 'react-router'
import Icon from '../components/Icon'

const NotFoundPage = () => {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-surface px-4 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl bg-surface-container-high text-primary">
        <Icon name="search_off" className="text-[28px]" />
      </span>
      <h1 className="text-headline-lg-mobile font-semibold">Page introuvable</h1>
      <p className="max-w-xs text-body-md text-on-surface-variant">
        Cette adresse ne correspond à aucune page de ClinicFlow.
      </p>
      <Link
        to="/"
        className="mt-2 flex h-11 items-center gap-2 rounded-lg bg-primary px-4 text-label-lg font-semibold text-on-primary shadow-md hover:bg-primary-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <Icon name="arrow_back" className="text-[20px]" />
        Retour à l'accueil
      </Link>
    </main>
  )
}

export default NotFoundPage
