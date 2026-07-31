import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import RutaProtegida from './routes/RutaProtegida';

// Páginas de la plataforma
import PanelAdmin from './pages/admin/PanelAdmin';
import PanelProfesor from './pages/profesor/PanelProfesor';
import PanelEstudiante from './pages/estudiante/PanelEstudiante';
import JugarActividad from './pages/estudiante/JugarActividad';

function AppRoutes() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Cargando plataforma...</p>
        </div>
      </div>
    );
  }

  // Redirección por defecto según rol
  const getDefaultRoute = () => {
    if (!profile) return '/login';
    if (profile.rol === 'admin') return '/admin';
    if (profile.rol === 'profesor') return '/profesor';
    return '/estudiante';
  };

  return (
    <Routes>
      {/* Ruta pública */}
      <Route path="/login" element={!profile ? <Login /> : <Navigate to={getDefaultRoute()} replace />} />

      {/* Rutas protegidas por rol */}
      <Route element={<RutaProtegida rolesPermitidos={['admin']} />}>
        <Route path="/admin" element={<PanelAdmin />} />
      </Route>

      <Route element={<RutaProtegida rolesPermitidos={['profesor']} />}>
        <Route path="/profesor" element={<PanelProfesor />} />
      </Route>

      <Route element={<RutaProtegida rolesPermitidos={['estudiante']} />}>
        <Route path="/estudiante" element={<PanelEstudiante />} />
        <Route path="/estudiante/actividad/:id" element={<JugarActividad />} />
      </Route>

      {/* Redirección por defecto */}
      <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
