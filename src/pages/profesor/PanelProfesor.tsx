import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/db';
import { Etapa, Perfil, Actividad, Asignacion } from '../../types/actividad';
import Estudiantes from './Estudiantes';
import { 
  GraduationCap, 
  Layers, 
  LogOut, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Activity, 
  LayoutDashboard, 
  PlusCircle, 
  Calendar,
  Sparkles,
  RefreshCw,
  FolderOpen
} from 'lucide-react';

export default function PanelProfesor() {
  const { profile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'resumen' | 'estudiantes' | 'etapas'>('resumen');
  
  // States for stats and data
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [estudiantesCount, setEstudiantesCount] = useState(0);
  const [actividadesCount, setActividadesCount] = useState(0);
  const [asignacionesCount, setAsignacionesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // States for new Stage form
  const [nuevaEtapaNombre, setNuevaEtapaNombre] = useState('');
  const [nuevaEtapaOrden, setNuevaEtapaOrden] = useState(1);
  const [stageError, setStageError] = useState('');
  const [stageSuccess, setStageSuccess] = useState('');

  const loadDashboardData = async () => {
    if (!profile) return;
    try {
      setLoading(true);
      
      // Load stages
      const stages = await db.getEtapas(profile.id);
      setEtapas(stages);

      // Load other counts
      const studs = await db.getEstudiantesPorProfesor(profile.id);
      setEstudiantesCount(studs.length);

      const acts = await db.getActividades(profile.id);
      setActividadesCount(acts.length);

      const asigs = await db.getAsignacionesDeProfesor(profile.id);
      setAsignacionesCount(asigs.length);

      if (stages.length > 0) {
        // Suggest next order number
        const maxOrder = Math.max(...stages.map(e => e.orden), 0);
        setNuevaEtapaOrden(maxOrder + 1);
      } else {
        setNuevaEtapaOrden(1);
      }

    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [profile]);

  const handleCrearEtapa = async (e: React.FormEvent) => {
    e.preventDefault();
    setStageError('');
    setStageSuccess('');

    if (!nuevaEtapaNombre.trim()) {
      setStageError('El nombre de la etapa es requerido.');
      return;
    }

    try {
      await db.crearEtapa(nuevaEtapaNombre.trim(), nuevaEtapaOrden, profile!.id);
      setStageSuccess('¡Etapa de aprendizaje creada con éxito!');
      setNuevaEtapaNombre('');
      await loadDashboardData();
    } catch (err: any) {
      setStageError(err.message || 'Error al crear la etapa');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 py-4 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-md shadow-blue-500/10">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white">Panel del Profesor</h1>
            <p className="text-xs text-gray-500 font-medium">ECO INCLUSIVO • Bienvenido, {profile?.nombre}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={loadDashboardData}
            title="Recargar datos"
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-extrabold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-2xl transition"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Cerrar Sesión</span>
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-2 flex gap-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('resumen')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'resumen'
              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Resumen
        </button>
        <button
          onClick={() => setActiveTab('estudiantes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'estudiantes'
              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Estudiantes y Asignaciones
        </button>
        <button
          onClick={() => setActiveTab('etapas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'etapas'
              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
          }`}
        >
          <Layers className="w-4 h-4" />
          Etapas de Aprendizaje
        </button>
      </div>

      {/* Main Panel Content */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
        {loading && activeTab === 'resumen' ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-semibold text-gray-500">Cargando información del profesor...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: RESUMEN / DASHBOARD */}
            {activeTab === 'resumen' && (
              <div className="space-y-8">
                {/* Greeting Card */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-blue-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl md:text-3xl font-black flex items-center gap-2">
                      ¡Hola, {profile?.nombre}! <Sparkles className="w-6 h-6 text-yellow-300 fill-yellow-300 animate-pulse" />
                    </h2>
                    <p className="text-blue-100 font-medium text-sm md:text-base max-w-xl">
                      Gestiona tus estudiantes, organiza las etapas de aprendizaje y asigna las actividades adaptadas a cada necesidad.
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-xs font-bold space-y-1 self-stretch md:self-auto flex flex-col justify-center">
                    <p className="text-blue-100 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Hoy es {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                    <p className="text-blue-100">✔ RLS Supabase & Mock Híbrido Activo</p>
                  </div>
                </div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Card 1: Estudiantes */}
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border dark:border-gray-700 shadow-sm flex items-center gap-4">
                    <div className="bg-blue-100 dark:bg-blue-950 p-4 rounded-xl text-blue-600 dark:text-blue-400">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="block text-2xl font-black text-gray-900 dark:text-white">{estudiantesCount}</span>
                      <span className="text-xs font-bold text-gray-400 uppercase">Estudiantes</span>
                    </div>
                  </div>

                  {/* Card 2: Etapas */}
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border dark:border-gray-700 shadow-sm flex items-center gap-4">
                    <div className="bg-amber-100 dark:bg-amber-950 p-4 rounded-xl text-amber-600 dark:text-amber-400">
                      <Layers className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="block text-2xl font-black text-gray-900 dark:text-white">{etapas.length}</span>
                      <span className="text-xs font-bold text-gray-400 uppercase">Etapas creadas</span>
                    </div>
                  </div>

                  {/* Card 3: Actividades */}
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border dark:border-gray-700 shadow-sm flex items-center gap-4">
                    <div className="bg-purple-100 dark:bg-purple-950 p-4 rounded-xl text-purple-600 dark:text-purple-400">
                      <Activity className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="block text-2xl font-black text-gray-900 dark:text-white">{actividadesCount}</span>
                      <span className="text-xs font-bold text-gray-400 uppercase">Actividades base</span>
                    </div>
                  </div>

                  {/* Card 4: Asignaciones */}
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border dark:border-gray-700 shadow-sm flex items-center gap-4">
                    <div className="bg-emerald-100 dark:bg-emerald-950 p-4 rounded-xl text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="block text-2xl font-black text-gray-900 dark:text-white">{asignacionesCount}</span>
                      <span className="text-xs font-bold text-gray-400 uppercase">Actividades Asignadas</span>
                    </div>
                  </div>
                </div>

                {/* Main Dashboard Info */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left block: Etapas Timeline */}
                  <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl border dark:border-gray-700 shadow-sm space-y-4">
                    <h3 className="font-extrabold text-base flex items-center gap-2">
                      <Layers className="w-5 h-5 text-amber-500" /> Secuencia de Etapas
                    </h3>
                    {etapas.length === 0 ? (
                      <div className="text-center py-10 border border-dashed rounded-xl border-gray-200 dark:border-gray-700">
                        <Layers className="w-10 h-10 text-gray-400 mx-auto mb-2 opacity-50" />
                        <p className="text-xs text-gray-400">No hay etapas registradas. Dirígete a la pestaña de "Etapas" para crear tu primera unidad de aprendizaje.</p>
                      </div>
                    ) : (
                      <div className="relative border-l-2 border-blue-100 dark:border-blue-900 ml-4 pl-6 space-y-6">
                        {etapas.map((etapa, idx) => (
                          <div key={etapa.id} className="relative">
                            <span className="absolute -left-10 top-0.5 bg-blue-600 text-white w-7 h-7 rounded-full text-xs font-black flex items-center justify-center">
                              {etapa.orden}
                            </span>
                            <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-xl border dark:border-gray-800 flex items-center justify-between">
                              <div>
                                <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">{etapa.nombre}</h4>
                                <p className="text-xs text-gray-400 font-semibold mt-0.5">Fase de aprendizaje ordenada</p>
                              </div>
                              <span className="text-xs font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-md border border-amber-100 dark:border-amber-950">
                                Orden: {etapa.orden}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right block: Quick tips or instructions */}
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border dark:border-gray-700 shadow-sm space-y-4">
                    <h3 className="font-extrabold text-base flex items-center gap-2">
                      <FolderOpen className="w-5 h-5 text-purple-500" /> Guía de Accesibilidad
                    </h3>
                    <div className="space-y-4 text-xs">
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 rounded-xl">
                        <p className="font-extrabold text-amber-800 dark:text-amber-400 uppercase mb-1">Ajuste Cognitivo</p>
                        <p className="text-gray-500 dark:text-gray-300 leading-relaxed font-semibold">Ofrece instrucciones más cortas, soporte de pictogramas interactivos y síntesis de voz automática (TTS) para simplificar la lectura.</p>
                      </div>
                      <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900 rounded-xl">
                        <p className="font-extrabold text-purple-800 dark:text-purple-400 uppercase mb-1">Ajuste Motriz</p>
                        <p className="text-gray-500 dark:text-gray-300 leading-relaxed font-semibold">Crea zonas de click e interacción gigantes y desactiva las mecánicas de arrastrar y soltar (drag & drop) que requieren coordinación de precisión.</p>
                      </div>
                      <div className="p-3 bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900 rounded-xl">
                        <p className="font-extrabold text-sky-800 dark:text-sky-400 uppercase mb-1">Ajuste TEA</p>
                        <p className="text-gray-500 dark:text-gray-300 leading-relaxed font-semibold">Estructura un diseño predecible, minimalista y libre de temporizadores, animaciones o elementos distractores para favorecer la concentración.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ESTUDIANTES Y ASIGNACIONES */}
            {activeTab === 'estudiantes' && (
              <Estudiantes />
            )}

            {/* TAB 3: ETAPAS DE APRENDIZAJE */}
            {activeTab === 'etapas' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form to create stage */}
                <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-sm border dark:border-gray-700 h-fit space-y-6">
                  <div className="flex items-center gap-2">
                    <PlusCircle className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-extrabold">Crear Nueva Etapa</h2>
                  </div>

                  <form onSubmit={handleCrearEtapa} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">
                        Nombre de la Etapa
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Etapa 3: Sílabas y Frases"
                        value={nuevaEtapaNombre}
                        onChange={(e) => setNuevaEtapaNombre(e.target.value)}
                        className="w-full px-3 py-2.5 border rounded-xl text-sm bg-gray-50/50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">
                        Orden Secuencial
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={nuevaEtapaOrden}
                        onChange={(e) => setNuevaEtapaOrden(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2.5 border rounded-xl text-sm bg-gray-50/50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      <p className="text-[10px] text-gray-400 font-semibold mt-1">
                        Determina la posición de esta etapa dentro de la ruta de aprendizaje del estudiante.
                      </p>
                    </div>

                    {stageError && <p className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950/20 p-2.5 rounded-lg border border-red-200 dark:border-red-900">{stageError}</p>}
                    {stageSuccess && <p className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-950/20 p-2.5 rounded-lg border border-green-200 dark:border-green-900">{stageSuccess}</p>}

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition shadow-md hover:shadow-blue-500/10 flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      Guardar Etapa
                    </button>
                  </form>
                </div>

                {/* List of Stages */}
                <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-sm border dark:border-gray-700 lg:col-span-2 space-y-6">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-extrabold">Etapas Registradas ({etapas.length})</h2>
                  </div>

                  {etapas.length === 0 ? (
                    <div className="text-center py-16 border border-dashed rounded-xl border-gray-300 dark:border-gray-600">
                      <Layers className="w-12 h-12 text-gray-400 mx-auto mb-2 opacity-50" />
                      <span className="text-sm font-semibold text-gray-500">No has registrado ninguna etapa todavía.</span>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-xl border dark:border-gray-700">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700 text-gray-400 font-bold">
                            <th className="py-3 px-4 w-20 text-center">Orden</th>
                            <th className="py-3 px-4">Nombre de la Etapa</th>
                            <th className="py-3 px-4 text-right">Identificador de Etapa</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-gray-700 font-medium">
                          {etapas.map((etapa) => (
                            <tr key={etapa.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition">
                              <td className="py-4 px-4 text-center">
                                <span className="inline-flex items-center justify-center w-7 h-7 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-black text-xs rounded-full">
                                  {etapa.orden}
                                </span>
                              </td>
                              <td className="py-4 px-4 font-bold text-gray-900 dark:text-white">{etapa.nombre}</td>
                              <td className="py-4 px-4 text-right text-gray-400 text-xs font-mono">{etapa.id}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
