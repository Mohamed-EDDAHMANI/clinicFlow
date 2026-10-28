import { useSelector } from 'react-redux'

const DashboardPage = () => {
  const user = useSelector((state) => state.auth.user)

  return (
    <section>
      <h1 className="text-headline-lg-mobile font-semibold lg:text-headline-lg">Tableau de bord</h1>
      <p className="mt-1 text-body-lg text-on-surface-variant">Bonjour {user?.full_name}.</p>
    </section>
  )
}

export default DashboardPage
