import { Link } from 'react-router'
import { ArrowLeft, SearchX } from 'lucide-react'

const NotFoundPage = () => (
  <main className="not-found">
    <div className="card">
      <span className="empty-icn mx-auto mb-4"><SearchX aria-hidden="true" /></span>
      <p className="code">404</p>
      <h1 className="mt-3 text-xl font-extrabold">Page introuvable</h1>
      <p className="muted mx-auto mt-2 max-w-xs">Cette adresse ne correspond à aucune page de ClinicFlow.</p>
      <Link to="/" className="btn btn-primary mt-6">
        <ArrowLeft aria-hidden="true" />
        Retour à l'accueil
      </Link>
    </div>
  </main>
)

export default NotFoundPage
