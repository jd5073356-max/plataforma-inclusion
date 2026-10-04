import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/db';
import { Actividad, Asignacion, Progreso } from '../../types/actividad';
import {
  ArrowLeft, CheckCircle2, Lock, Play, RefreshCw, MapPin, Trophy, Sparkles
} from 'lucide-react';

interface RutaAsignada extends Asignacion {
  etapa: { id: string; nombre: string; orden: number };
  pasos: Actividad[];
}

const tipoEmoji = (tipo: string): string => {
  const mapa: Record<string, string> = {
    seleccion: '✅', emparejar: '🔗', clasificar: '🗂️', completar: '🧩',
    reconocer_emociones: '😊', autoevaluacion: '🌟'
  };
  return mapa[tipo] || '⭐';
};

export default function RutaEtapa() {
  const { etapaId } = useParams<{ etapaId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [ruta, setRuta] = useState<RutaAsignada | null>(null);
  const [progresos, setProgresos] = useState<Progreso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    if (!profile || !etapaId) return;
    try {
      setLoading(true);
      setError('');
      const rutas = await db.getRutasAsignadas(profile.id);
      const encontrada = rutas.find(r => r.etapa.id === etapaId);
      if (!encontrada) {
        setError('Esta ruta no está asignada a tu cuenta.');
        return;
      }
      setRuta(encontrada);
      const prog = await db.getProgresoEstudiante(profile.id);
      setProgresos(prog);
    } catch (err) {
      console.error('Error al cargar la ruta:', err);
      setError('No pudimos cargar la ruta.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [profile, etapaId]);

  if (!profile) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex flex-col items-center justify-center p-6 font-sans-atelier">
        <div className="w-12 h-12 border-4 border-[#EE7C6A] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-bold text-[#78716C]">Cargando tu camino...</p>
      </div>
    );
  }

  if (error || !ruta) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex flex-col items-center justify-center p-6 font-sans-atelier">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-[#EFECE6] space-y-5">
          <h2 className="text-2xl font-serif-atelier font-bold text-[#1C1917]">Ruta no disponible</h2>
          <p className="text-sm text-[#78716C]">{error || 'No encontramos esta ruta.'}</p>
          <button
            onClick={() => navigate('/estudiante')}
            className="w-full py-3 bg-[#EE7C6A] hover:bg-[#E46653] text-white font-bold rounded-2xl transition flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a mis rutas
          </button>
        </div>
      </div>
    );
  }

  const completado = (actividadId: string) =>
    progresos.some(p => p.actividad_id === actividadId && p.completado);

  // Linealidad estricta: el paso actual es el primero sin completar.
  // Los pasos siguientes están bloqueados; los anteriores se pueden repetir.
  const indiceActual = ruta.pasos.findIndex(p => !completado(p.id));
  const terminados = ruta.pasos.filter(p => completado(p.id)).length;
  const rutaCompleta = terminados === ruta.pasos.length && ruta.pasos.length > 0;

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1C1917] font-sans-atelier">
      <header className="sticky top-0 z-40 bg-[#FBF9F5]/90 backdrop-blur-md border-b border-[#EFECE6] px-4 md:px-6 py-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('/estudiante')}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#EFECE6] rounded-full text-xs font-bold text-[#57534E] hover:bg-[#F5F2EC] transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Mis rutas
        </button>
        <button
          type="button"
          onClick={loadData}
          className="p-2.5 bg-white border border-[#EFECE6] rounded-full text-[#78716C] hover:text-[#1C1917] transition shadow-sm"
          title="Actualizar progreso"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </header>

      <main className="max-w-3xl w-full mx-auto p-4 md:p-8">
        {/* Encabezado de la ruta */}
        <div className="bg-[#1C1917] text-white rounded-[28px] p-6 md:p-8 shadow-lg border border-[#292524] mb-8">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-[#EE7C6A]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#EE7C6A]">Ruta de aprendizaje</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif-atelier font-bold">{ruta.etapa.nombre}</h1>
          <div className="mt-5 flex items-center gap-3">
            <div className="flex-1 h-3 bg-[#292524] rounded-full overflow-hidden border border-[#44403C]">
              <div
                className="h-full bg-[#EE7C6A] transition-all duration-500"
                style={{ width: `${ruta.pasos.length ? (terminados / ruta.pasos.length) * 100 : 0}%` }}
              />
            </div>
            <span className="text-xs font-bold whitespace-nowrap">{terminados} de {ruta.pasos.length}</span>
          </div>
          {rutaCompleta && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-[#F59E0B]/20 text-[#F59E0B] rounded-full text-xs font-bold">
              <Trophy className="w-3.5 h-3.5" /> ¡Ruta completa! Puedes repetir los pasos que quieras
            </div>
          )}
        </div>

        {/* Camino lineal de pasos */}
        <div className="relative pl-8 space-y-4">
          {/* Línea del camino */}
          <span className="absolute left-[15px] top-3 bottom-3 w-0.5 bg-[#EFECE6]" aria-hidden />

          {ruta.pasos.map((paso, idx) => {
            const hecho = completado(paso.id);
            const esActual = idx === indiceActual;
            const bloqueado = !hecho && !esActual && (indiceActual === -1 || idx > indiceActual);

            return (
              <div key={paso.id} className="relative">
                {/* Marcador del paso */}
                <span
                  className={`absolute -left-8 top-6 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 z-10 ${
                    hecho
                      ? 'bg-[#10B981] border-[#10B981] text-white'
                      : esActual
                        ? 'bg-[#EE7C6A] border-[#EE7C6A] text-white ring-4 ring-[#EE7C6A]/30'
                        : 'bg-white border-[#EFECE6] text-[#A8A29E]'
                  }`}
                >
                  {hecho ? <CheckCircle2 className="w-4 h-4" /> : bloqueado ? <Lock className="w-3.5 h-3.5" /> : idx + 1}
                </span>

                <div
                  className={`p-5 rounded-[24px] border flex flex-col md:flex-row md:items-center gap-4 transition-all ${
                    esActual
                      ? 'bg-white border-[#EE7C6A] shadow-md'
                      : hecho
                        ? 'bg-white/70 border-[#EFECE6]'
                        : 'bg-white/50 border-[#EFECE6] opacity-70'
                  }`}
                >
                  <div className="text-3xl shrink-0">{tipoEmoji(paso.tipo)}</div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#A8A29E]">
                      Paso {idx + 1} · {paso.tipo.replace(/_/g, ' ')}
                    </p>
                    <h3 className="font-serif-atelier font-bold text-lg text-[#1C1917] leading-snug truncate">
                      {paso.titulo}
                    </h3>
                  </div>

                  {bloqueado ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-[#A8A29E] px-4 py-2 bg-[#F5F2EC] rounded-full shrink-0">
                      <Lock className="w-3.5 h-3.5" /> Completa el anterior
                    </span>
                  ) : hecho ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/estudiante/actividad/${paso.id}`)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#F5F2EC] hover:bg-[#EBE8E0] text-[#57534E] font-bold text-xs rounded-full transition shrink-0"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Repetir
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate(`/estudiante/actividad/${paso.id}`)}
                      className="flex items-center gap-1.5 px-5 py-2.5 bg-[#EE7C6A] hover:bg-[#E46653] text-white font-bold text-xs rounded-full transition shadow-sm shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> {esActual ? 'Continuar' : 'Jugar'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {ruta.pasos.length === 0 && (
          <div className="text-center py-16 bg-white border border-dashed rounded-[28px] border-[#EFECE6]">
            <Sparkles className="w-12 h-12 text-[#A8A29E] mx-auto mb-3 opacity-50" />
            <p className="text-sm font-bold text-[#78716C]">Esta ruta aún no tiene pasos. Tu profesor la está preparando.</p>
          </div>
        )}
      </main>
    </div>
  );
}
