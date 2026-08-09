import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/db';
import { Actividad, Asignacion, Progreso } from '../../types/actividad';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  Sparkles, 
  Play, 
  CheckCircle2, 
  Award, 
  Trophy, 
  BookOpen, 
  RefreshCw,
  Star,
  Activity,
  User,
  Layout,
  Compass
} from 'lucide-react';

interface AsignacionConActividad extends Asignacion {
  actividad: Actividad;
}

export default function PanelEstudiante() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [asignaciones, setAsignaciones] = useState<AsignacionConActividad[]>([]);
  const [progresos, setProgreso] = useState<Progreso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStudentData = async () => {
    if (!profile) return;
    try {
      setLoading(true);
      setError('');
      
      const asigs = await db.getAsignacionesPorEstudiante(profile.id);
      setAsignaciones(asigs);

      const prog = await db.getProgresoEstudiante(profile.id);
      setProgreso(prog);
    } catch (err: any) {
      console.error('Error al cargar datos del estudiante:', err);
      setError('No pudimos cargar tus actividades. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, [profile]);

  if (!profile) return null;

  const isActividadCompletada = (actividadId: string) => {
    const prog = progresos.find(p => p.actividad_id === actividadId);
    return prog ? prog.completado : false;
  };

  const completadasCount = asignaciones.filter(a => isActividadCompletada(a.actividad.id)).length;
  const pendientesCount = asignaciones.length - completadasCount;

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'seleccion': return 'Selección Múltiple';
      case 'emparejar': return 'Unir Parejas';
      case 'clasificar': return 'Clasificar en Cajones';
      case 'completar': return 'Rellenar Huecos';
      case 'reconocer_emociones': return 'Reconocer Emociones';
      case 'explorador_3d': return 'Explorador 3D';
      default: return 'Unidad Didáctica';
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'seleccion': return <Award className="w-5 h-5 text-[#EE7C6A]" />;
      case 'emparejar': return <Activity className="w-5 h-5 text-[#7294B9]" />;
      case 'clasificar': return <Layout className="w-5 h-5 text-[#F59E0B]" />;
      case 'completar': return <BookOpen className="w-5 h-5 text-[#10B981]" />;
      case 'reconocer_emociones': return <Sparkles className="w-5 h-5 text-[#EE7C6A]" />;
      default: return <Star className="w-5 h-5 text-[#7294B9]" />;
    }
  };

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
              title="Recargar actividades"
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
        
        {/* Banner Atelier Gamificado */}
        <div className="bg-[#1C1917] text-white rounded-[28px] p-6 md:p-8 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden border border-[#292524]">
          <div className="space-y-3 z-10 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EE7C6A]/20 text-[#EE7C6A] rounded-full text-xs font-bold uppercase">
              <Sparkles className="w-3.5 h-3.5" /> ¡Bienvenido al Atelier!
            </div>
            <h2 className="text-3xl md:text-4xl font-serif-atelier font-bold">
              ¡Hola, {profile.nombre}! 👋
            </h2>
            <p className="text-[#A8A29E] font-medium text-sm md:text-base max-w-lg">
              Tienes unidades de indagación y desafíos preparados para explorar hoy.
            </p>
          </div>

          {/* Gamified stats dashboard */}
          <div className="grid grid-cols-3 gap-3 md:gap-4 w-full md:w-auto z-10">
            <div className="bg-[#292524] border border-[#44403C] rounded-2xl p-4 text-center">
              <span className="block text-2xl md:text-3xl font-serif-atelier font-bold">{asignaciones.length}</span>
              <span className="text-[10px] md:text-xs font-bold uppercase text-[#A8A29E]">Totales</span>
            </div>
            <div className="bg-[#292524] border border-[#44403C] rounded-2xl p-4 text-center">
              <span className="block text-2xl md:text-3xl font-serif-atelier font-bold text-[#F59E0B]">⭐ {completadasCount}</span>
              <span className="text-[10px] md:text-xs font-bold uppercase text-[#A8A29E]">Listas</span>
            </div>
            <div className="bg-[#292524] border border-[#44403C] rounded-2xl p-4 text-center">
              <span className="block text-2xl md:text-3xl font-serif-atelier font-bold text-[#EE7C6A]">{pendientesCount}</span>
              <span className="text-[10px] md:text-xs font-bold uppercase text-[#A8A29E]">Por Explorar</span>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 bg-[#FFF2F0] border border-[#FFCCC7] rounded-2xl text-[#D9363E] text-xs font-bold text-center">
            {error}
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#EE7C6A] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-bold text-[#78716C]">Cargando tus actividades de exploración...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-serif-atelier font-bold text-[#1C1917] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#EE7C6A]" /> Mis Actividades Asignadas
              </h3>
              <span className="text-xs font-bold bg-white border border-[#EFECE6] px-3.5 py-1.5 rounded-full text-[#78716C]">
                Curso: <b className="text-[#1C1917]">{profile.curso}</b>
              </span>
            </div>

            {asignaciones.length === 0 ? (
              <div className="bg-white text-center py-16 px-6 border border-dashed rounded-[28px] border-[#EFECE6] shadow-sm max-w-xl mx-auto">
                <BookOpen className="w-16 h-16 text-[#A8A29E] mx-auto mb-4 opacity-50" />
                <h4 className="text-xl font-serif-atelier font-bold text-[#1C1917] mb-2">¡Todo al día!</h4>
                <p className="text-xs text-[#78716C]">Tu profesor no te ha asignado actividades en este momento. Descansa o avísale si necesitas tareas.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {asignaciones.map((asig) => {
                  const completada = isActividadCompletada(asig.actividad.id);
                  return (
                    <div 
                      key={asig.id} 
                      className={`bg-white rounded-[24px] border border-[#EFECE6] shadow-sm transition-all duration-300 hover:shadow-md flex flex-col justify-between overflow-hidden`}
                    >
                      <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getTipoIcon(asig.actividad.tipo)}
                            <span className="text-xs font-bold text-[#78716C] uppercase tracking-wider">
                              {getTipoLabel(asig.actividad.tipo)}
                            </span>
                          </div>
                          
                          {asig.ajuste && (
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F5F2EC] text-[#57534E] border border-[#EBE8E0]">
                              Ajuste: {asig.ajuste === 'cognitiva' ? 'Cognitivo' : asig.ajuste === 'motriz' ? 'Motriz' : 'TEA'}
                            </span>
                          )}
                        </div>

                        <div>
                          <h4 className="text-2xl font-serif-atelier font-bold text-[#1C1917] leading-snug">
                            {asig.actividad.titulo}
                          </h4>
                          <p className="text-xs text-[#78716C] mt-1 flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-[#A8A29E]" /> Preparado por tu educador
                          </p>
                        </div>
                      </div>

                      <div className="px-6 py-4 bg-[#FBF9F5] border-t border-[#EFECE6] flex items-center justify-between gap-4">
                        {completada ? (
                          <>
                            <span className="flex items-center gap-1.5 text-xs font-bold text-[#10B981]">
                              <CheckCircle2 className="w-4 h-4" /> ¡Completada!
                            </span>
                            <button
                              onClick={() => navigate(`/estudiante/actividad/${asig.actividad.id}`)}
                              className="flex items-center gap-1.5 px-4 py-2 bg-[#F5F2EC] hover:bg-[#EBE8E0] text-[#57534E] font-bold text-xs rounded-full transition"
                            >
                              Repetir exploración 🔄
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="text-xs font-bold text-[#B45309] bg-[#FFF8F0] px-3 py-1 rounded-full border border-[#FFE8D0]">
                              Pendiente
                            </span>
                            <button
                              onClick={() => navigate(`/estudiante/actividad/${asig.actividad.id}`)}
                              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#EE7C6A] hover:bg-[#E46653] text-white font-bold text-xs rounded-full transition shadow-sm"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" /> ¡Explorar!
                            </button>
                          </>
                        )}
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
