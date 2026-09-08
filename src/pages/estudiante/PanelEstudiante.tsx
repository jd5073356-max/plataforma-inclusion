import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/db';
import { Progreso } from '../../types/actividad';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, Play, CheckCircle2, RefreshCw, Compass, MapPin, Trophy, Sparkles
} from 'lucide-react';

const msgErr = (err: unknown) => (err instanceof Error ? err.message : 'Ocurrió un error inesperado');

interface RutaAsignada {
  id: string;
  etapa: { id: string; nombre: string; orden: number };
  pasos: { id: string; titulo: string; tipo: string }[];
}

export default function PanelEstudiante() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [rutas, setRutas] = useState<RutaAsignada[]>([]);
  const [progresos, setProgresos] = useState<Progreso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStudentData = async () => {
    if (!profile) return;
    try {
      setLoading(true);
      setError('');

      const rutasAsignadas = await db.getRutasAsignadas(profile.id);
      setRutas(rutasAsignadas.map(r => ({
        id: r.id,
        etapa: r.etapa,
        pasos: r.pasos.map(p => ({ id: p.id, titulo: p.titulo, tipo: p.tipo }))
      })));

      const prog = await db.getProgresoEstudiante(profile.id);
      setProgresos(prog);
    } catch (err) {
      console.error('Error al cargar datos del estudiante:', err);
      setError('No pudimos cargar tus rutas. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, [profile]);

  if (!profile) return null;

  const terminadosDe = (pasos: { id: string }[]) =>
    pasos.filter(p => progresos.some(pr => pr.actividad_id === p.id && pr.completado)).length;

  const totalPasos = rutas.reduce((acc, r) => acc + r.pasos.length, 0);
  const totalTerminados = rutas.reduce((acc, r) => acc + terminadosDe(r.pasos), 0);

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1C1917] flex flex-col font-sans-atelier">
      {/* Top Header */}
      <header className="bg-[#FBF9F5]/90 backdrop-blur-md border-b border-[#EFECE6] py-4 px-6 sticky top-0 z-50">
        <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#EE7C6A] p-2.5 rounded-2xl text-white shadow-sm">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-serif-atelier font-bold text-[#1C1917] leading-none flex items-center gap-1">
                ECO INCLUSIVO <span className="text-[#EE7C6A] text-xs font-sans-atelier align-super">✦</span>
              </h1>
              <p className="text-xs text-[#78716C] font-medium mt-0.5">Atelier Estudiantil • Aprendizaje Inmersivo</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadStudentData}
              title="Recargar rutas"
              className="p-2.5 bg-[#F5F2EC] hover:bg-[#EBE8E0] rounded-full text-[#78716C] hover:text-[#1C1917] transition border border-[#EBE8E0]"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-[#EE7C6A]/10 text-[#EE7C6A] hover:bg-[#EE7C6A]/20 font-bold text-xs rounded-full transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-6 md:p-8 max-w-6xl w-full mx-auto space-y-8">

        {/* Banner de bienvenida */}
        <div className="bg-[#1C1917] text-white rounded-[28px] p-6 md:p-8 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden border border-[#292524]">
          <div className="space-y-3 z-10 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EE7C6A]/20 text-[#EE7C6A] rounded-full text-xs font-bold uppercase">
              <Sparkles className="w-3.5 h-3.5" /> ¡Hola, {profile.nombre}!
            </div>
            <h2 className="text-3xl md:text-4xl font-serif-atelier font-bold">
              Tus rutas de exploración
            </h2>
            <p className="text-[#A8A29E] font-medium text-sm md:text-base max-w-lg">
              Avanza paso a paso: cada ruta es un camino con actividades en orden.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 w-full md:w-auto z-10">
            <div className="bg-[#292524] border border-[#44403C] rounded-2xl p-4 text-center">
              <span className="block text-2xl md:text-3xl font-serif-atelier font-bold">{rutas.length}</span>
              <span className="text-[10px] md:text-xs font-bold uppercase text-[#A8A29E]">Rutas</span>
            </div>
            <div className="bg-[#292524] border border-[#44403C] rounded-2xl p-4 text-center">
              <span className="block text-2xl md:text-3xl font-serif-atelier font-bold text-[#F59E0B]">{totalTerminados}<span className="text-sm text-[#A8A29E]">/{totalPasos}</span></span>
              <span className="text-[10px] md:text-xs font-bold uppercase text-[#A8A29E]">Pasos listos</span>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-[#FFF2F0] border border-[#FFCCC7] rounded-2xl text-[#D9363E] text-xs font-bold text-center">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#EE7C6A] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-bold text-[#78716C]">Cargando tus rutas de exploración...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <h3 className="text-xl font-serif-atelier font-bold text-[#1C1917] flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#EE7C6A]" /> Mis Rutas Asignadas
            </h3>

            {rutas.length === 0 ? (
              <div className="bg-white text-center py-16 px-6 border border-dashed rounded-[28px] border-[#EFECE6] shadow-sm max-w-xl mx-auto">
                <MapPin className="w-16 h-16 text-[#A8A29E] mx-auto mb-4 opacity-50" />
                <h4 className="text-xl font-serif-atelier font-bold text-[#1C1917] mb-2">¡Todo al día!</h4>
                <p className="text-xs text-[#78716C]">Tu profesor no te ha asignado rutas en este momento. Avísale si necesitas tareas.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rutas.map((ruta) => {
                  const terminados = terminadosDe(ruta.pasos);
                  const total = ruta.pasos.length;
                  const completa = total > 0 && terminados === total;
                  const pct = total ? (terminados / total) * 100 : 0;

                  return (
                    <div
                      key={ruta.id}
                      className={`bg-white rounded-[24px] border shadow-sm transition-all hover:shadow-md flex flex-col overflow-hidden ${
                        completa ? 'border-[#10B981]/40' : 'border-[#EFECE6]'
                      }`}
                    >
                      <div className="p-6 space-y-4 flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[#EE7C6A]">
                            <MapPin className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Ruta</span>
                          </div>
                          {completa && (
                            <span className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">
                              <Trophy className="w-3 h-3" /> Completa
                            </span>
                          )}
                        </div>

                        <h4 className="text-2xl font-serif-atelier font-bold text-[#1C1917] leading-snug">
                          {ruta.etapa.nombre}
                        </h4>

                        <div>
                          <div className="flex items-center justify-between text-xs font-bold text-[#78716C] mb-1.5">
                            <span>Progreso del camino</span>
                            <span>{terminados} de {total} pasos</span>
                          </div>
                          <div className="h-2.5 bg-[#F5F2EC] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${completa ? 'bg-[#10B981]' : 'bg-[#EE7C6A]'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="px-6 py-4 bg-[#FBF9F5] border-t border-[#EFECE6] flex items-center justify-between gap-4">
                        <span className="text-xs font-bold text-[#78716C]">
                          {completa ? 'Puedes repetir los pasos 🔄' : terminados > 0 ? `Vas por el paso ${terminados + 1}` : 'Comienza el camino ✨'}
                        </span>
                        <button
                          onClick={() => navigate(`/estudiante/ruta/${ruta.etapa.id}`)}
                          className={`flex items-center gap-1.5 px-5 py-2.5 font-bold text-xs rounded-full transition shadow-sm text-white ${
                            completa ? 'bg-[#10B981] hover:bg-[#0EA371]' : 'bg-[#EE7C6A] hover:bg-[#E46653]'
                          }`}
                        >
                          {completa ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                          {completa ? 'Repasar' : terminados > 0 ? 'Continuar' : 'Comenzar'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
