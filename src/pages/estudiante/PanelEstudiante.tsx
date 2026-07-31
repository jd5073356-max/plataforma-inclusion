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
  Layout
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
      
      // Load student assignments
      const asigs = await db.getAsignacionesPorEstudiante(profile.id);
      setAsignaciones(asigs);

      // Load progress
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

  // Helper to check if an activity is completed
  const isActividadCompletada = (actividadId: string) => {
    const prog = progresos.find(p => p.actividad_id === actividadId);
    return prog ? prog.completado : false;
  };

  // Helper to count total completed activities
  const completadasCount = asignaciones.filter(a => isActividadCompletada(a.actividad.id)).length;
  const pendientesCount = asignaciones.length - completadasCount;

  // Friendly activity type descriptions
  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'seleccion': return 'Selección Múltiple';
      case 'emparejar': return 'Unir Parejas';
      case 'clasificar': return 'Clasificar en Cajones';
      case 'completar': return 'Rellenar Huecos';
      case 'reconocer_emociones': return 'Reconocer Emociones';
      default: return 'Actividad Educativa';
    }
  };

  // Icon depending on activity type
  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'seleccion': return <Award className="w-5 h-5 text-amber-500" />;
      case 'emparejar': return <Activity className="w-5 h-5 text-purple-500" />;
      case 'clasificar': return <Layout className="w-5 h-5 text-sky-500" />;
      case 'completar': return <BookOpen className="w-5 h-5 text-emerald-500" />;
      case 'reconocer_emociones': return <Sparkles className="w-5 h-5 text-rose-500" />;
      default: return <Star className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f3f9f6] to-[#e8f5ed] dark:from-gray-900 dark:to-gray-950 text-gray-800 dark:text-gray-100 flex flex-col">
      {/* Top Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md border-b border-emerald-100 dark:border-gray-700 py-4 px-6 sticky top-0 z-50">
        <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2.5 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-emerald-900 dark:text-white">Portal de Aprendizaje</h1>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">¡Diviértete y aprende jugando!</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadStudentData}
              title="Recargar actividades"
              className="p-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-2xl text-emerald-700 dark:text-emerald-300 transition-all border border-emerald-100 dark:border-gray-600"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-extrabold text-sm rounded-2xl transition border border-rose-100 dark:border-rose-900/50"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-6 md:p-8 max-w-6xl w-full mx-auto space-y-8">
        
        {/* Welcome Card with Mascot/Gamification stats */}
        <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 text-white rounded-3xl p-6 md:p-8 shadow-xl shadow-emerald-500/10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-12 translate-y-12">
            <Trophy className="w-64 h-64" />
          </div>

          <div className="space-y-3 z-10 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-black tracking-wider uppercase backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" /> ¡Bienvenido Estudiante!
            </div>
            <h2 className="text-3xl md:text-4xl font-black">
              ¡Hola, {profile.nombre}! 👋
            </h2>
            <p className="text-emerald-100 font-bold text-sm md:text-base max-w-lg">
              Tienes actividades preparadas por tu profesor para ayudarte a crecer. ¡A por ellas!
            </p>
          </div>

          {/* Gamified stats dashboard */}
          <div className="grid grid-cols-3 gap-3 md:gap-4 w-full md:w-auto z-10">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center">
              <span className="block text-2xl md:text-3xl font-black">{asignaciones.length}</span>
              <span className="text-[10px] md:text-xs font-black uppercase text-emerald-100">Totales</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center">
              <span className="block text-2xl md:text-3xl font-black text-yellow-300">⭐ {completadasCount}</span>
              <span className="text-[10px] md:text-xs font-black uppercase text-emerald-100">Listas</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center animate-pulse">
              <span className="block text-2xl md:text-3xl font-black text-rose-200">{pendientesCount}</span>
              <span className="text-[10px] md:text-xs font-black uppercase text-emerald-100">Por Jugar</span>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm font-bold text-center">
            {error}
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Preparando tus juegos...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-emerald-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" /> Mis Actividades Asignadas
              </h3>
              <span className="text-xs font-bold bg-white dark:bg-gray-800 border border-emerald-100 dark:border-gray-700 px-3 py-1.5 rounded-full text-emerald-800 dark:text-emerald-300 shadow-sm">
                Curso: <b>{profile.curso}</b>
              </span>
            </div>

            {asignaciones.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 text-center py-16 px-6 border border-dashed rounded-3xl border-emerald-200 dark:border-gray-700 shadow-sm max-w-xl mx-auto">
                <BookOpen className="w-16 h-16 text-emerald-200 dark:text-gray-600 mx-auto mb-4" />
                <h4 className="text-xl font-bold text-emerald-900 dark:text-white mb-2">¡Todo al día!</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tu profesor no te ha asignado actividades en este momento. Descansa o avísale si necesitas tareas.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {asignaciones.map((asig) => {
                  const completada = isActividadCompletada(asig.actividad.id);
                  return (
                    <div 
                      key={asig.id} 
                      className={`bg-white dark:bg-gray-800 rounded-3xl border-3 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.01] flex flex-col justify-between overflow-hidden ${
                        completada 
                          ? 'border-emerald-100 dark:border-emerald-950/20' 
                          : 'border-white hover:border-emerald-400 dark:border-gray-800 dark:hover:border-emerald-600'
                      }`}
                    >
                      {/* Card Header Info */}
                      <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getTipoIcon(asig.actividad.tipo)}
                            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                              {getTipoLabel(asig.actividad.tipo)}
                            </span>
                          </div>
                          
                          {/* Accessibility tag if any */}
                          {asig.ajuste && (
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              asig.ajuste === 'cognitiva' 
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' 
                                : asig.ajuste === 'motriz' 
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300' 
                                  : 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300'
                            }`}>
                              Ajuste: {asig.ajuste === 'cognitiva' ? 'Cognitivo' : asig.ajuste === 'motriz' ? 'Motriz' : 'TEA'}
                            </span>
                          )}
                        </div>

                        <div>
                          <h4 className="text-xl font-extrabold text-gray-900 dark:text-white mb-1.5 leading-snug">
                            {asig.actividad.titulo}
                          </h4>
                          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-gray-300" /> Preparado por tu educador
                          </p>
                        </div>
                      </div>

                      {/* Card Action footer */}
                      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t dark:border-gray-700/50 flex items-center justify-between gap-4">
                        {completada ? (
                          <>
                            <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-5 h-5 fill-current bg-white rounded-full" /> ¡Completada!
                            </span>
                            <button
                              onClick={() => navigate(`/estudiante/actividad/${asig.actividad.id}`)}
                              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-extrabold text-xs rounded-xl transition border border-emerald-100 dark:border-emerald-900/50"
                            >
                              Repetir juego 🔄
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/10 dark:text-amber-400 px-2.5 py-1 rounded-lg">
                              Pendiente por jugar
                            </span>
                            <button
                              onClick={() => navigate(`/estudiante/actividad/${asig.actividad.id}`)}
                              className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm rounded-xl transition-all shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:scale-[1.02]"
                            >
                              <Play className="w-4 h-4 fill-current" /> ¡Jugar!
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
