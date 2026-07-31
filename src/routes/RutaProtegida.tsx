import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface RutaProtegidaProps {
  rolesPermitidos: ('admin' | 'profesor' | 'estudiante')[];
}

export const RutaProtegida: React.FC<RutaProtegidaProps> = ({ rolesPermitidos }) => {
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

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  if (!rolesPermitidos.includes(profile.rol)) {
    // Redirigir a su panel por defecto según su rol real
    if (profile.rol === 'admin') return <Navigate to="/admin" replace />;
    if (profile.rol === 'profesor') return <Navigate to="/profesor" replace />;
    return <Navigate to="/estudiante" replace />;
  }

  return <Outlet />;
};

export default RutaProtegida;
