import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/db';
import { Actividad, Asignacion } from '../../types/actividad';
import AtelierExplorador from '../../components/atelier/AtelierExplorador';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export default function JugarActividad() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const [actividad, setActividad] = useState<Actividad | null>(null);
  const [asignacion, setAsignacion] = useState<Asignacion | null>(null);
  const [todasLasActividades, setTodasLasActividades] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadPlayData() {
      if (!id || !profile) return;
      try {
        setLoading(true);
        setError('');

        // 1. Obtener detalles de la actividad principal
        const act = await db.getActividad(id);
        if (!act) {
          setError('La actividad solicitada no existe.');
          setLoading(false);
          return;
        }
        setActividad(act);

        // 2. Obtener todas las asignaciones del estudiante para armar el catálogo de la biblioteca
        const asigs = await db.getAsignacionesPorEstudiante(profile.id);
        const matchingAsig = asigs.find(a => a.actividad_id === id);
        
        if (matchingAsig) {
          setAsignacion(matchingAsig);
        }

        // Cargar objetos de actividades asociadas
        if (asigs.length > 0) {
          const actsList = await Promise.all(asigs.map(a => db.getActividad(a.actividad_id)));
          setTodasLasActividades(actsList.filter(Boolean) as Actividad[]);
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
      <div className="min-h-screen bg-[#FBF9F5] flex flex-col items-center justify-center p-6 font-sans-atelier">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#EE7C6A] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xl font-serif-atelier font-bold text-[#1C1917]">Abriendo la experiencia Atelier...</p>
        </div>
      </div>
    );
  }

  if (error || !actividad) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex flex-col items-center justify-center p-6 font-sans-atelier">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-[#EFECE6] space-y-6">
          <AlertCircle className="w-16 h-16 text-[#EE7C6A] mx-auto" />
          <h2 className="text-2xl font-serif-atelier font-bold text-[#1C1917]">¡Ups! Algo salió mal</h2>
          <p className="text-[#78716C] text-sm">{error || 'No pudimos iniciar esta actividad.'}</p>
          <button
            onClick={() => navigate('/estudiante')}
            className="w-full py-3 bg-[#EE7C6A] hover:bg-[#E46653] text-white font-bold rounded-2xl transition flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver al Portal Estudiantil
          </button>
        </div>
      </div>
    );
  }

  const handleCompletado = () => {
    navigate('/estudiante');
  };

  return (
    <AtelierExplorador
      actividadActual={actividad}
      listaActividades={todasLasActividades.length > 0 ? todasLasActividades : [actividad]}
      onSeleccionarActividad={(act) => setActividad(act)}
      estudianteId={profile.id}
      ajuste={asignacion?.ajuste}
      onCompletado={handleCompletado}
      modoPreview={false}
    />
  );
}
