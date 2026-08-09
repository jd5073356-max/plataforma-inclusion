import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/db';
import { Etapa, Perfil, Actividad, Asignacion } from '../../types/actividad';
import Estudiantes from './Estudiantes';
import Actividades from './Actividades';
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
  const [activeTab, setActiveTab] = useState<'resumen' | 'estudiantes' | 'etapas' | 'actividades'>('resumen');
  
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
    <div className="min-h-screen bg-[#FBF9F5] text-[#1C1917] flex flex-col font-sans-atelier">
      {/* Top Navbar */}
      <header className="bg-[#FBF9F5]/90 backdrop-blur-md border-b border-[#EFECE6] py-4 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-[#EE7C6A] p-2.5 rounded-2xl text-white shadow-sm">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-serif-atelier font-bold text-[#1C1917] leading-none flex items-center gap-1.5">
              Panel del Profesor <span className="text-[#EE7C6A] text-xs font-sans-atelier align-super">✦</span>
            </h1>
            <p className="text-xs text-[#78716C] font-medium mt-0.5">ECO INCLUSIVO • Bienvenido, {profile?.nombre}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={loadDashboardData}
            title="Recargar datos"
            className="p-2 text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F2EC] rounded-xl transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#EE7C6A] hover:bg-[#EE7C6A]/10 rounded-full transition"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Cerrar Sesión</span>
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-[#F5F2EC] border-b border-[#EFECE6] px-6 py-2 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('resumen')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
            activeTab === 'resumen'
              ? 'bg-white text-[#1C1917] shadow-sm'
              : 'text-[#78716C] hover:text-[#1C1917]'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 text-[#EE7C6A]" />
          Resumen
        </button>
        <button
          onClick={() => setActiveTab('estudiantes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
            activeTab === 'estudiantes'
              ? 'bg-white text-[#1C1917] shadow-sm'
              : 'text-[#78716C] hover:text-[#1C1917]'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-[#7294B9]" />
          Estudiantes y Asignaciones
        </button>
        <button
          onClick={() => setActiveTab('etapas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
            activeTab === 'etapas'
              ? 'bg-white text-[#1C1917] shadow-sm'
              : 'text-[#78716C] hover:text-[#1C1917]'
          }`}
        >
          <Layers className="w-4 h-4 text-[#F59E0B]" />
          Etapas de Aprendizaje
        </button>
        <button
          onClick={() => setActiveTab('actividades')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
            activeTab === 'actividades'
              ? 'bg-white text-[#1C1917] shadow-sm'
              : 'text-[#78716C] hover:text-[#1C1917]'
          }`}
        >
          <Activity className="w-4 h-4 text-[#10B981]" />
          Banco de Actividades
        </button>
      </div>

      {/* Main Panel Content */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
        {loading && activeTab === 'resumen' ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#EE7C6A] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-semibold text-[#78716C]">Cargando información del profesor...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: RESUMEN / DASHBOARD */}
            {activeTab === 'resumen' && (
              <div className="space-y-8">
                {/* Greeting Card */}
                <div className="bg-[#1C1917] rounded-[28px] p-6 md:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-[#292524]">
                  <div className="space-y-2">
                    <h2 className="text-2xl md:text-3xl font-serif-atelier font-bold flex items-center gap-2">
                      ¡Hola, {profile?.nombre}! <Sparkles className="w-6 h-6 text-[#EE7C6A] fill-[#EE7C6A] animate-pulse" />
                    </h2>
                    <p className="text-[#A8A29E] font-medium text-sm md:text-base max-w-xl">
                      Gestiona tus estudiantes, organiza las etapas de aprendizaje y asigna las actividades adaptadas a cada necesidad.
                    </p>
                  </div>
                  <div className="bg-[#292524] rounded-2xl p-4 border border-[#44403C] text-xs font-bold space-y-1 self-stretch md:self-auto flex flex-col justify-center">
                    <p className="text-[#E7E5E4] flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#EE7C6A]" /> Hoy es {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                    <p className="text-[#A8A29E]">✔ Sistema Atelier Activo</p>
                  </div>
                </div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Card 1: Estudiantes */}
                  <div className="bg-white p-6 rounded-[24px] border border-[#EFECE6] shadow-sm flex items-center gap-4">
                    <div className="bg-[#7294B9]/15 p-4 rounded-2xl text-[#7294B9]">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="block text-3xl font-serif-atelier font-bold text-[#1C1917]">{estudiantesCount}</span>
                      <span className="text-xs font-bold text-[#78716C] uppercase tracking-wider">Estudiantes</span>
                    </div>
                  </div>

                  {/* Card 2: Etapas */}
                  <div className="bg-white p-6 rounded-[24px] border border-[#EFECE6] shadow-sm flex items-center gap-4">
                    <div className="bg-[#F59E0B]/15 p-4 rounded-2xl text-[#F59E0B]">
                      <Layers className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="block text-3xl font-serif-atelier font-bold text-[#1C1917]">{etapas.length}</span>
                      <span className="text-xs font-bold text-[#78716C] uppercase tracking-wider">Etapas creadas</span>
                    </div>
                  </div>

                  {/* Card 3: Actividades */}
                  <div className="bg-white p-6 rounded-[24px] border border-[#EFECE6] shadow-sm flex items-center gap-4">
                    <div className="bg-[#EE7C6A]/15 p-4 rounded-2xl text-[#EE7C6A]">
                      <Activity className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="block text-3xl font-serif-atelier font-bold text-[#1C1917]">{actividadesCount}</span>
                      <span className="text-xs font-bold text-[#78716C] uppercase tracking-wider">Actividades base</span>
                    </div>
                  </div>

                  {/* Card 4: Asignaciones */}
                  <div className="bg-white p-6 rounded-[24px] border border-[#EFECE6] shadow-sm flex items-center gap-4">
                    <div className="bg-[#10B981]/15 p-4 rounded-2xl text-[#10B981]">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="block text-3xl font-serif-atelier font-bold text-[#1C1917]">{asignacionesCount}</span>
                      <span className="text-xs font-bold text-[#78716C] uppercase tracking-wider">Actividades Asignadas</span>
                    </div>
                  </div>
                </div>

                {/* Main Dashboard Info */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left block: Etapas Timeline */}
                  <div className="lg:col-span-2 bg-white p-6 rounded-[24px] border border-[#EFECE6] shadow-sm space-y-4">
                    <h3 className="font-serif-atelier text-xl font-bold text-[#1C1917] flex items-center gap-2">
                      <Layers className="w-5 h-5 text-[#F59E0B]" /> Secuencia de Etapas
                    </h3>
                    {etapas.length === 0 ? (
                      <div className="text-center py-10 border border-dashed rounded-2xl border-[#EFECE6]">
                        <Layers className="w-10 h-10 text-[#A8A29E] mx-auto mb-2 opacity-50" />
                        <p className="text-xs text-[#78716C]">No hay etapas registradas. Dirígete a la pestaña de "Etapas" para crear tu primera unidad de aprendizaje.</p>
                      </div>
                    ) : (
                      <div className="relative border-l-2 border-[#EFECE6] ml-4 pl-6 space-y-6">
                        {etapas.map((etapa, idx) => (
                          <div key={etapa.id} className="relative">
                            <span className="absolute -left-10 top-0.5 bg-[#EE7C6A] text-white w-7 h-7 rounded-full text-xs font-black flex items-center justify-center">
                              {etapa.orden}
                            </span>
                            <div className="bg-[#FBF9F5] p-4 rounded-2xl border border-[#EFECE6] flex items-center justify-between">
                              <div>
                                <h4 className="font-bold text-sm text-[#1C1917]">{etapa.nombre}</h4>
                                <p className="text-xs text-[#78716C] mt-0.5">Fase de aprendizaje ordenada</p>
                              </div>
                              <span className="text-xs font-bold bg-[#F59E0B]/10 text-[#B45309] px-3 py-1 rounded-full border border-[#F59E0B]/20">
                                Orden: {etapa.orden}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right block: Quick tips or instructions */}
                  <div className="bg-white p-6 rounded-[24px] border border-[#EFECE6] shadow-sm space-y-4">
                    <h3 className="font-serif-atelier text-xl font-bold text-[#1C1917] flex items-center gap-2">
                      <FolderOpen className="w-5 h-5 text-[#7294B9]" /> Guía de Accesibilidad
                    </h3>
                    <div className="space-y-4 text-xs">
                      <div className="p-4 bg-[#FFF8F0] border border-[#FFE8D0] rounded-2xl">
                        <p className="font-bold text-[#92400E] uppercase mb-1">Ajuste Cognitivo</p>
                        <p className="text-[#57534E] leading-relaxed">Ofrece instrucciones más cortas, soporte de pictogramas interactivos y síntesis de voz automática (TTS) para simplificar la lectura.</p>
                      </div>
                      <div className="p-4 bg-[#F5F2EC] border border-[#EBE8E0] rounded-2xl">
                        <p className="font-bold text-[#1C1917] uppercase mb-1">Ajuste Motriz</p>
                        <p className="text-[#57534E] leading-relaxed">Crea zonas de click e interacción gigantes y desactiva las mecánicas de arrastrar y soltar (drag & drop) que requieren coordinación de precisión.</p>
                      </div>
                      <div className="p-4 bg-[#F0F7FF] border border-[#D0E2FF] rounded-2xl">
                        <p className="font-bold text-[#002D9C] uppercase mb-1">Ajuste TEA</p>
                        <p className="text-[#002D9C]/80 leading-relaxed">Estructura un diseño predecible, minimalista y libre de temporizadores, animaciones o elementos distractores para favorecer la concentración.</p>
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

            {/* TAB 4: BANCO DE ACTIVIDADES */}
            {activeTab === 'actividades' && (
              <Actividades />
            )}
          </>
        )}
      </main>
    </div>
  );
}
