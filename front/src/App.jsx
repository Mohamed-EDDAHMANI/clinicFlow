import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router';

import PublicRoute from './routes/PublicRoute';
import ProtectedRoute from './routes/ProtectedRoute';
import { ROLES } from './config/roles';

import AppLayout from './components/AppLayout';
import Toaster from './components/Toaster';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import AppointmentsPage from './pages/AppointmentsPage';
import NotFoundPage from './pages/NotFoundPage';

const PatientRedirect = ({ edit = false }) => {
  const { id } = useParams()
  return <Navigate to={edit ? `/patients?fiche=${id}&modal=edit-patient&id=${id}` : `/patients?fiche=${id}`} replace />
}

function App() {
  return (
    <Router>
      <Routes>

        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.STAFF]} />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/patients/new" element={<Navigate to="/patients?modal=new-patient" replace />} />
            <Route path="/patients/:id" element={<PatientRedirect />} />
            <Route path="/patients/:id/edit" element={<PatientRedirect edit />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/appointments/new" element={<Navigate to="/appointments?modal=new-appointment" replace />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFoundPage />} />

      </Routes>
      <Toaster />
    </Router>
  )
}

export default App
