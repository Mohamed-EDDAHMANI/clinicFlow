import { BrowserRouter as Router, Routes, Route } from 'react-router';

import PublicRoute from './routes/PublicRoute';
import ProtectedRoute from './routes/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import ResetRedux from './pages/ResetRedux';

function App() {
  return (
    <Router>
      <Routes>

        {/*  Public Routes  */}
        <Route element={<PublicRoute />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/*  Private Routes - user  */}
        <Route element={<ProtectedRoute allowedRoles={['user']} />}>
          <Route path="/home" element={<HomePage />} />
        </Route>

        {/*  Private Routes - admin  */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>

        {/*  Utils  */}
        <Route path="/reset" element={<ResetRedux />} />
        <Route path="*" element={<NotFoundPage />} />

      </Routes>
    </Router>
  )
}

export default App
