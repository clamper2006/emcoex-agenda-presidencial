import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import FullScreenLoader from './components/common/FullScreenLoader.jsx';
import LandingScreen from './components/screens/LandingScreen.jsx';
import LoginScreen from './components/screens/LoginScreen.jsx';
import NoAutorizadoScreen from './components/screens/NoAutorizadoScreen.jsx';
import AgendaScreen from './components/screens/AgendaScreen.jsx';

// Agenda Emcoex — pivote desde el ERP-Comex original (9 roles) hacia
// una app de un solo usuario: el presidente. Sin RoleProvider, sin
// /pendiente ni /roles. Solo 4 rutas: landing, login, no-autorizado,
// y la agenda misma.
export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <HashRouter>
            <ScrollToTopOnNavigate />
            <Routes>
              <Route path="/" element={<Navigate to="/landing" replace />} />
              <Route path="/landing" element={<LandingScreen />} />
              <Route path="/login" element={<LoginScreen />} />
              <Route
                path="/no-autorizado"
                element={
                  <RequireSession>
                    <NoAutorizadoScreen />
                  </RequireSession>
                }
              />
              <Route
                path="/agenda/*"
                element={
                  <RequireAuthorized>
                    <AgendaScreen />
                  </RequireAuthorized>
                }
              />
              <Route path="*" element={<Navigate to="/landing" replace />} />
            </Routes>
          </HashRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

function RequireSession({ children }) {
  const { authLoading, session } = useAuth();
  if (authLoading) return <FullScreenLoader message="Verificando tu sesión…" />;
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

function RequireAuthorized({ children }) {
  const { authLoading, session, isAuthorized } = useAuth();
  if (authLoading) return <FullScreenLoader message="Verificando tu sesión…" />;
  if (!session) return <Navigate to="/login" replace />;
  if (!isAuthorized) return <Navigate to="/no-autorizado" replace />;
  return children;
}

function ScrollToTopOnNavigate() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);
  return null;
}
