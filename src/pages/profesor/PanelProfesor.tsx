import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/db';
import { Etapa } from '../../types/actividad';
import Estudiantes from './Estudiantes';
import Rutas from './Rutas';
import Actividades from './Actividades';
import {
  GraduationCap,
  LogOut,
  CheckCircle2,
  Activity,
  LayoutDashboard,
  Calendar,
  Sparkles,
  RefreshCw,
  Route
} from 'lucide-react';

export default function PanelProfesor() {
  const { profile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'resumen' | 'estudiantes' | 'rutas' | 'banco'>('resumen');
  
  // States for stats and data
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [estudiantesCount, setEstudiantesCount] = useState(0);
  const [actividadesCount, setActividadesCount] = useState(0);
  const [asignacionesCount, setAsignacionesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    if (!profile) return;
    try {
      setLoading(true);

      // Load routes
      const stages = await db.getEtapas(profile.id);
      setEtapas(stages);

      // Load other counts
      const studs = await db.getEstudiantesPorProfesor(profile.id);
      setEstudiantesCount(studs.length);

      const acts = await db.getActividades(profile.id);
      setActividadesCount(acts.length);

      const asigs = await db.getAsignacionesDeProfesor(profile.id);
      setAsignacionesCount(asigs.length);

    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [profile]);

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
          onClick={() => setActiveTab('rutas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
            activeTab === 'rutas'
              ? 'bg-white text-[#1C1917] shadow-sm'
              : 'text-[#78716C] hover:text-[#1C1917]'
          }`}
        >
          <Route className="w-4 h-4 text-[#F59E0B]" />
          Rutas
        </button>
        <button
          onClick={() => setActiveTab('banco')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
            activeTab === 'banco'
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
                      <Route className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="block text-3xl font-serif-atelier font-bold text-[#1C1917]">{etapas.length}</span>
                      <span className="text-xs font-bold text-[#78716C] uppercase tracking-wider">Rutas creadas</span>
                    </div>
                  </div>

                  {/* Card 3: Actividades */}
                  <div className="bg-white p-6 rounded-[24px] border border-[#EFECE6] shadow-sm flex items-center gap-4">
                    <div className="bg-[#EE7C6A]/15 p-4 rounded-2xl text-[#EE7C6A]">
                      <Activity className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="block text-3xl font-serif-atelier font-bold text-[#1C1917]">{actividadesCount}</span>
                      <span className="text-xs font-bold text-[#78716C] uppercase tracking-wider">Actividades totales</span>
                    </div>
                  </div>

                  {/* Card 4: Asignaciones */}
                  <div className="bg-white p-6 rounded-[24px] border border-[#EFECE6] shadow-sm flex items-center gap-4">
                    <div className="bg-[#10B981]/15 p-4 rounded-2xl text-[#10B981]">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="block text-3xl font-serif-atelier font-bold text-[#1C1917]">{asignacionesCount}</span>
                      <span className="text-xs font-bold text-[#78716C] uppercase tracking-wider">Rutas asignadas</span>
                    </div>
                  </div>
                </div>

                {/* Main Dashboard Info */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left block: Etapas Timeline */}
                  <div className="lg:col-span-2 bg-white p-6 rounded-[24px] border border-[#EFECE6] shadow-sm space-y-4">
                    <h3 className="font-serif-atelier text-xl font-bold text-[#1C1917] flex items-center gap-2">
                      <Route className="w-5 h-5 text-[#F59E0B]" /> Secuencia de Rutas
                    </h3>
                    {etapas.length === 0 ? (
                      <div className="text-center py-10 border border-dashed rounded-2xl border-[#EFECE6]">
                        <Route className="w-10 h-10 text-[#A8A29E] mx-auto mb-2 opacity-50" />
                        <p className="text-xs text-[#78716C]">No hay rutas registradas. Dirígete a la pestaña de "Rutas" para crear tu primera unidad de aprendizaje.</p>
                      </div>
                    ) : (
                      <div className="relative border-l-2 border-[#EFECE6] ml-4 pl-6 space-y-6">
                        {etapas.map((etapa) => (
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
                      <Route className="w-5 h-5 text-[#7294B9]" /> Guía de Accesibilidad
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

            {/* TAB 3: RUTAS DE APRENDIZAJE */}
            {activeTab === 'rutas' && (
              <Rutas />
            )}

            {/* TAB 4: BANCO DE PLANTILLAS */}
            {activeTab === 'banco' && (
              <Actividades />
            )}
          </>
        )}
      </main>
    </div>
  );
}
