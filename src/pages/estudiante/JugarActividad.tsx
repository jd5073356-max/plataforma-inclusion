import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/db';
import { Actividad, Asignacion } from '../../types/actividad';
import ReproductorEnfocado from '../../components/reproductor/ReproductorEnfocado';
import { ArrowLeft, ArrowRight, PartyPopper, Home, Trophy } from 'lucide-react';

export default function JugarActividad() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [actividad, setActividad] = useState<Actividad | null>(null);
  const [asignacion, setAsignacion] = useState<Asignacion | null>(null);
  const [pasos, setPasos] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pasoTerminado, setPasoTerminado] = useState(false);
  const [rutaTerminada, setRutaTerminada] = useState(false);

  useEffect(() => {
    async function loadPlayData() {
      if (!id || !profile) return;
      try {
        setLoading(true);
        setError('');
        setPasoTerminado(false);
        setRutaTerminada(false);

        const act = await db.getActividad(id);
        if (!act) {
          setError('La actividad solicitada no existe.');
          return;
        }
        setActividad(act);

        // Cargar la ruta (etapa) a la que pertenece el paso y sus hermanos
        if (act.etapa_id) {
          const [rutas, pasosDeRuta] = await Promise.all([
            db.getRutasAsignadas(profile.id),
            db.getPasosDeEtapa(act.etapa_id)
          ]);
          setPasos(pasosDeRuta);
          setAsignacion(rutas.find(r => r.etapa.id === act.etapa_id) || null);
        }
      } catch (err) {
        console.error('Error al cargar la actividad:', err);
        setError('Ocurrió un error al cargar la actividad.');
      } finally {
        setLoading(false);
      }
    }

    loadPlayData();
  }, [id, profile]);

  const indicePaso = useMemo(
    () => pasos.findIndex(p => p.id === actividad?.id),
    [pasos, actividad]
  );
  const siguientePaso = indicePaso >= 0 && indicePaso < pasos.length - 1 ? pasos[indicePaso + 1] : null;

  if (!profile) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex flex-col items-center justify-center p-6 font-sans-atelier">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#EE7C6A] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xl font-serif-atelier font-bold text-[#1C1917]">Abriendo la actividad...</p>
        </div>
      </div>
    );
  }

  if (error || !actividad) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex flex-col items-center justify-center p-6 font-sans-atelier">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-[#EFECE6] space-y-6">
          <AlertCircleIcon />
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

  // Al completar el quiz: mostrar celebración y avanzar linealmente
  const handleCompletado = () => {
    setPasoTerminado(true);
    setRutaTerminada(!siguientePaso);
  };

  const irASiguiente = () => {
    if (siguientePaso) {
      navigate(`/estudiante/actividad/${siguientePaso.id}`);
    } else if (actividad.etapa_id) {
      navigate(`/estudiante/ruta/${actividad.etapa_id}`);
    } else {
      navigate('/estudiante');
    }
  };

  return (
    <>
      <ReproductorEnfocado
        key={actividad.id}
        actividad={actividad}
        ajuste={asignacion?.ajuste}
        estudianteId={profile.id}
        pasoActual={indicePaso >= 0 ? indicePaso + 1 : 1}
        totalPasos={Math.max(pasos.length, 1)}
        onCompletado={handleCompletado}
        onVolver={() => (actividad.etapa_id ? navigate(`/estudiante/ruta/${actividad.etapa_id}`) : navigate('/estudiante'))}
        modoPreview={!actividad.etapa_id}
      />

      {/* Celebración al cerrar el paso */}
      {pasoTerminado && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#FBF9F5] w-full max-w-md rounded-[28px] border border-[#EFECE6] shadow-2xl p-8 text-center space-y-5">
            {rutaTerminada ? (
              <>
                <div className="w-16 h-16 mx-auto bg-[#F59E0B]/15 rounded-full flex items-center justify-center">
                  <Trophy className="w-9 h-9 text-[#F59E0B]" />
                </div>
                <h2 className="text-2xl font-serif-atelier font-bold text-[#1C1917]">
                  ¡Ruta completada! 🎉
                </h2>
                <p className="text-sm text-[#78716C]">
                  Terminaste todos los pasos de esta ruta. ¡Excelente trabajo, {profile.nombre}!
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => navigate('/estudiante')}
                    className="w-full py-3 bg-[#EE7C6A] hover:bg-[#E46653] text-white font-bold rounded-2xl transition flex items-center justify-center gap-2"
                  >
                    <Home className="w-4 h-4" /> Volver a mis rutas
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/estudiante/ruta/${actividad.etapa_id}`)}
                    className="w-full py-2.5 bg-[#F5F2EC] hover:bg-[#EBE8E0] text-[#57534E] font-bold text-xs rounded-2xl transition"
                  >
                    Ver el camino recorrido
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto bg-[#10B981]/15 rounded-full flex items-center justify-center">
                  <PartyPopper className="w-9 h-9 text-[#10B981]" />
                </div>
                <h2 className="text-2xl font-serif-atelier font-bold text-[#1C1917]">
                  ¡Paso {indicePaso + 1} completado!
                </h2>
                <p className="text-sm text-[#78716C]">
                  Siguiente: <b className="text-[#1C1917]">{siguientePaso?.titulo}</b>
                </p>
                <button
                  type="button"
                  onClick={irASiguiente}
                  className="w-full py-3.5 bg-[#EE7C6A] hover:bg-[#E46653] text-white font-bold rounded-2xl transition flex items-center justify-center gap-2 group"
                >
                  Siguiente paso <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function AlertCircleIcon() {
  return <span className="text-4xl">😕</span>;
}
