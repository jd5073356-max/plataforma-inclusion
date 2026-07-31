import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/db';
import { Actividad, Asignacion } from '../../types/actividad';
import ReproductorActividad from '../../components/reproductor/ReproductorActividad';
import { ArrowLeft, AlertCircle, Sparkles, Home } from 'lucide-react';

export default function JugarActividad() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const [actividad, setActividad] = useState<Actividad | null>(null);
  const [asignacion, setAsignacion] = useState<Asignacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadPlayData() {
      if (!id || !profile) return;
      try {
        setLoading(true);
        setError('');

        // 1. Get activity details
        const act = await db.getActividad(id);
        if (!act) {
          setError('La actividad solicitada no existe.');
          setLoading(false);
          return;
        }
        setActividad(act);

        // 2. Get assignments to check adjustment (ajuste)
        const asigs = await db.getAsignacionesPorEstudiante(profile.id);
        const matchingAsig = asigs.find(a => a.actividad_id === id);
        
        if (matchingAsig) {
          setAsignacion(matchingAsig);
        }
      } catch (err: any) {
        console.error('Error al cargar la actividad:', err);
        setError('Ocurrió un error al cargar la actividad.');
      } finally {
        setLoading(false);
      }
    }

    loadPlayData();
  }, [id, profile]);

  if (!profile) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">Abriendo tu juego...</p>
        </div>
      </div>
    );
  }

  if (error || !actividad) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-6">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-gray-100 dark:border-gray-700 space-y-6">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto" />
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">¡Ups! Algo salió mal</h2>
          <p className="text-gray-500 dark:text-gray-400 font-semibold">{error || 'No pudimos iniciar esta actividad.'}</p>
          <button
            onClick={() => navigate('/estudiante')}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-2xl transition flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver al Portal
          </button>
        </div>
      </div>
    );
  }

  const handleCompletado = () => {
    // Navigate back to student panel on completion
    navigate('/estudiante');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Top action bar to go back */}
      <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 py-3 px-6 shadow-sm">
        <div className="max-w-4xl w-full mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/estudiante')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-extrabold rounded-xl transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Salir del juego
          </button>

          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
              {actividad.titulo}
            </span>
          </div>

          <button
            onClick={() => navigate('/estudiante')}
            title="Volver al inicio"
            className="p-1.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg transition"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Play area */}
      <div className="flex-1">
        <ReproductorActividad
          actividad={actividad}
          ajuste={asignacion?.ajuste}
          estudianteId={profile.id}
          onCompletado={handleCompletado}
        />
      </div>
    </div>
  );
}
