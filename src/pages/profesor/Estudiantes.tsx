import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/db';
import { Perfil, Etapa, Asignacion, Actividad, Progreso } from '../../types/actividad';
import {
  UserPlus,
  Trash2,
  ClipboardCheck,
  GraduationCap,
  RefreshCw,
  CheckCircle2,
  MessageSquare,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

export default function Estudiantes() {
  const { profile } = useAuth();
  const [estudiantes, setEstudiantes] = useState<Perfil[]>([]);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [progresos, setProgresos] = useState<Progreso[]>([]);
  const [detalleAbiertoId, setDetalleAbiertoId] = useState<string | null>(null);

  // Create Student Form state
  const [nombre, setNombre] = useState('');
  const [curso, setCurso] = useState('');

  // Assign Route state
  const [selectedEstudianteId, setSelectedEstudianteId] = useState<string | null>(null);
  const [selectedEtapaId, setSelectedEtapaId] = useState('');
  const [ajuste, setAjuste] = useState<'cognitiva' | 'motriz' | 'tea' | ''>('cognitiva');

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ error: '', success: '' });

  const loadData = async () => {
    if (!profile) return;
    try {
      const [studs, ets, asigs, acts, progs] = await Promise.all([
        db.getEstudiantesPorProfesor(profile.id),
        db.getEtapas(profile.id),
        db.getAsignacionesDeProfesor(profile.id),
        db.getActividades(profile.id),
        db.getTodoElProgreso()
      ]);
      setEstudiantes(studs);
      setEtapas(ets);
      setAsignaciones(asigs);
      setActividades(acts);
      setProgresos(progs);
    } catch (err) {
      console.error('Error loading teacher data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [profile]);

  const handleCrearEstudiante = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({ error: '', success: '' });
    setLoading(true);

    try {
      if (!nombre.trim() || !curso.trim()) {
        throw new Error('Ingresa el nombre y el curso del estudiante');
      }
      await db.crearEstudiante(nombre.trim(), curso.trim(), '123456', profile!.id);
      setMsg({ error: '', success: '¡Estudiante registrado! Ya puede entrar solo con su nombre y curso.' });
      setNombre('');
      setCurso('');
      await loadData();
    } catch (err) {
      setMsg({ error: err instanceof Error ? err.message : 'Error al registrar estudiante', success: '' });
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarEstudiante = async (est: Perfil) => {
    if (!window.confirm(`¿Eliminar al estudiante «${est.nombre}» y todo su progreso?`)) return;
    try {
      await db.eliminarPerfil(est.id);
      setMsg({ error: '', success: `Estudiante ${est.nombre} eliminado.` });
      await loadData();
    } catch (err) {
      setMsg({ error: err instanceof Error ? err.message : 'No se pudo eliminar el estudiante.', success: '' });
    }
  };

  const handleAsignar = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({ error: '', success: '' });
    if (!selectedEstudianteId || !selectedEtapaId) {
      setMsg({ error: 'Debes seleccionar un estudiante y una ruta', success: '' });
      return;
    }

    try {
      await db.asignarRuta(selectedEstudianteId, selectedEtapaId, ajuste || undefined);
      const nombreRuta = etapas.find(e => e.id === selectedEtapaId)?.nombre || 'la ruta';
      setMsg({ error: '', success: `Ruta «${nombreRuta}» asignada correctamente.` });
      setSelectedEtapaId('');
      await loadData();
    } catch (err) {
      setMsg({ error: err instanceof Error ? err.message : 'Error al asignar', success: '' });
    }
  };

  const handleDesasignar = async (estudianteId: string, etapaId: string) => {
    try {
      await db.desasignarRuta(estudianteId, etapaId);
      await loadData();
    } catch (err) {
      console.error('Error al desasignar:', err);
    }
  };

  const getEstudianteAsignaciones = (estudianteId: string) =>
    asignaciones.filter(a => a.estudiante_id === estudianteId);

  const getResumenEstudiante = (estudianteId: string) => {
    const asigs = getEstudianteAsignaciones(estudianteId);
    const etapaIds = new Set(asigs.map(a => a.etapa_id));
    const pasosAsignados = actividades
      .filter(a => a.etapa_id && etapaIds.has(a.etapa_id))
      .sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99));
    const progEst = progresos.filter(p => p.estudiante_id === estudianteId);
    const completados = pasosAsignados.filter(paso =>
      progEst.some(pr => pr.actividad_id === paso.id && pr.completado)
    ).length;
    const intentosTotales = progEst.reduce((acc, p) => acc + (p.intentos || 0), 0);
    const notasFamiliares = progEst.filter(p => p.nota_familiar && p.nota_familiar.trim() !== '');
    return {
      pasosAsignados,
      progEst,
      completados,
      totalPasos: pasosAsignados.length,
      intentosTotales,
      notasFamiliares
    };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 font-sans-atelier">
      {/* Col 1: Add Student & Quick Assignment */}
      <div className="space-y-8">
        {/* Formulario Estudiante */}
        <div className="bg-white p-6 rounded-[24px] border border-[#EFECE6] shadow-sm">
          <h2 className="text-xl font-serif-atelier font-bold text-[#1C1917] mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#EE7C6A]" /> Registrar Estudiante
          </h2>
          <form onSubmit={handleCrearEstudiante} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#78716C] uppercase mb-1.5">Nombre Completo</label>
              <input
                type="text"
                placeholder="Ej: María Paula Peñuela"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[#EFECE6] rounded-2xl text-xs bg-[#FBF9F5] text-[#1C1917] focus:outline-none focus:border-[#EE7C6A]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#78716C] uppercase mb-1.5">Curso o Nivel</label>
              <input
                type="text"
                placeholder="Ej: 901, 3A, 4B"
                value={curso}
                onChange={(e) => setCurso(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[#EFECE6] rounded-2xl text-xs bg-[#FBF9F5] text-[#1C1917] focus:outline-none focus:border-[#EE7C6A]"
                required
              />
            </div>

            {msg.success && <p className="text-xs text-[#10B981] font-bold bg-[#ECFDF5] p-3 rounded-xl border border-[#A7F3D0]">{msg.success}</p>}
            {msg.error && <p className="text-xs text-[#D9363E] font-bold bg-[#FFF2F0] p-3 rounded-xl border border-[#FFCCC7]">{msg.error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#EE7C6A] hover:bg-[#E46653] text-white rounded-2xl font-bold transition text-xs shadow-sm"
            >
              Registrar Estudiante
            </button>
          </form>
        </div>

        {/* Asignación de Rutas */}
        <div className="bg-white p-6 rounded-[24px] border border-[#EFECE6] shadow-sm">
          <h2 className="text-xl font-serif-atelier font-bold text-[#1C1917] mb-4 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-[#7294B9]" /> Asignar Ruta
          </h2>
          <form onSubmit={handleAsignar} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#78716C] uppercase mb-1.5">Estudiante</label>
              <select
                value={selectedEstudianteId || ''}
                onChange={(e) => setSelectedEstudianteId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[#EFECE6] rounded-2xl text-xs bg-[#FBF9F5] text-[#1C1917] focus:outline-none focus:border-[#EE7C6A]"
                required
              >
                <option value="">Selecciona un estudiante</option>
                {estudiantes.map(est => (
                  <option key={est.id} value={est.id}>{est.nombre} ({est.curso})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#78716C] uppercase mb-1.5">Ruta de aprendizaje</label>
              <select
                value={selectedEtapaId}
                onChange={(e) => setSelectedEtapaId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[#EFECE6] rounded-2xl text-xs bg-[#FBF9F5] text-[#1C1917] focus:outline-none focus:border-[#EE7C6A]"
                required
              >
                <option value="">Selecciona una ruta</option>
                {etapas.map(et => (
                  <option key={et.id} value={et.id}>{et.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#78716C] uppercase mb-1.5">Ajuste de Accesibilidad</label>
              <select
                value={ajuste}
                onChange={(e) => setAjuste(e.target.value as any)}
                className="w-full px-3.5 py-2.5 border border-[#EFECE6] rounded-2xl text-xs bg-[#FBF9F5] text-[#1C1917] focus:outline-none focus:border-[#EE7C6A]"
              >
                <option value="cognitiva">Cognitivo (Instrucciones cortas, pictogramas, TTS)</option>
                <option value="motriz">Motriz (Zonas de click gigantes, sin arrastrar)</option>
                <option value="tea">TEA (Layout simple y predecible, cero animaciones)</option>
                <option value="">Ninguno (Estándar)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#7294B9] hover:bg-[#5C7D9E] text-white rounded-2xl font-bold transition text-xs shadow-sm"
            >
              Asignar Ruta
            </button>
          </form>
        </div>
      </div>

      {/* Col 2 & 3: Students, Progress, and Family Bitácora */}
      <div className="bg-white p-6 rounded-[24px] border border-[#EFECE6] shadow-sm lg:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-serif-atelier font-bold text-[#1C1917] flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#EE7C6A]" /> Estudiantes, Progreso y Bitácora ({estudiantes.length})
            </h2>
            <p className="text-xs text-[#78716C]">
              Supervisa los pasos completados, intentos y observaciones familiares de cada estudiante.
            </p>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="p-2 border border-[#EFECE6] rounded-full hover:bg-[#F5F2EC] text-[#78716C]"
            title="Sincronizar progreso"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {estudiantes.length === 0 ? (
          <div className="text-center py-16 border border-dashed rounded-2xl border-[#EFECE6]">
            <GraduationCap className="w-12 h-12 text-[#A8A29E] mx-auto mb-2 opacity-50" />
            <p className="text-xs font-semibold text-[#78716C]">Aún no has registrado ningún estudiante.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {estudiantes.map((est) => {
              const activeAsigs = getEstudianteAsignaciones(est.id);
              const resumen = getResumenEstudiante(est.id);
              const pct = resumen.totalPasos > 0 ? Math.round((resumen.completados / resumen.totalPasos) * 100) : 0;
              const abierto = detalleAbiertoId === est.id;

              return (
                <div key={est.id} className="border rounded-2xl border-[#EFECE6] bg-[#FBF9F5] overflow-hidden">
                  <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[#1C1917] text-sm">{est.nombre}</span>
                        <span className="px-2.5 py-0.5 text-[11px] font-bold bg-[#EE7C6A]/10 text-[#EE7C6A] rounded-full">
                          Curso {est.curso}
                        </span>
                        {resumen.notasFamiliares.length > 0 && (
                          <span className="px-2.5 py-0.5 text-[11px] font-bold bg-[#ECFDF5] text-[#065F46] rounded-full flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> {resumen.notasFamiliares.length} nota(s) familiar(es)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#78716C]">
                        Ingreso rápido: <b>{est.nombre}</b> · Curso <b>{est.curso}</b>
                      </p>

                      {/* Barra de progreso en tiempo real */}
                      {resumen.totalPasos > 0 && (
                        <div className="pt-1.5 max-w-xs space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold text-[#57534E]">
                            <span>
                              Avance: {resumen.completados}/{resumen.totalPasos} pasos ({pct}%)
                            </span>
                            <span>{resumen.intentosTotales} intento(s)</span>
                          </div>
                          <div className="h-2 bg-[#EFECE6] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#10B981] transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 max-w-md">
                      <span className="block text-[10px] font-bold text-[#78716C] uppercase tracking-wider mb-1.5">
                        Rutas asignadas ({activeAsigs.length})
                      </span>
                      {activeAsigs.length === 0 ? (
                        <span className="text-xs font-bold text-[#B45309] bg-[#FFF8F0] px-2.5 py-1 rounded-full border border-[#FFE8D0]">
                          Sin rutas
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {activeAsigs.map((asig) => {
                            const etapa = etapas.find(e => e.id === asig.etapa_id);
                            if (!etapa) return null;
                            return (
                              <div
                                key={asig.id}
                                className="flex items-center gap-1.5 px-3 py-1 bg-white border border-[#EFECE6] rounded-full shadow-sm text-xs font-bold text-[#1C1917]"
                              >
                                <span className="truncate max-w-[170px]">{etapa.nombre}</span>
                                {asig.ajuste && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] uppercase font-bold bg-[#F5F2EC] text-[#57534E]">
                                    {asig.ajuste}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDesasignar(est.id, asig.etapa_id)}
                                  className="text-[#A8A29E] hover:text-[#D9363E] transition ml-1"
                                  title="Desasignar ruta"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 self-end md:self-center">
                      {resumen.totalPasos > 0 && (
                        <button
                          type="button"
                          onClick={() => setDetalleAbiertoId(abierto ? null : est.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-[#EFECE6] text-xs font-bold text-[#1C1917] hover:bg-[#F5F2EC] transition"
                        >
                          {abierto ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          Ver pasos
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleEliminarEstudiante(est)}
                        className="p-2 text-[#A8A29E] hover:text-[#D9363E] hover:bg-[#FFF2F0] rounded-full transition"
                        title="Eliminar estudiante"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Desglose detallado de pasos y bitácora familiar */}
                  {abierto && (
                    <div className="border-t border-[#EFECE6] bg-white p-4 space-y-2">
                      <span className="block text-[11px] font-extrabold uppercase tracking-wider text-[#78716C]">
                        Detalle de actividades y observaciones en casa:
                      </span>
                      <div className="grid grid-cols-1 gap-2">
                        {resumen.pasosAsignados.map((paso, idx) => {
                          const reg = resumen.progEst.find(p => p.actividad_id === paso.id);
                          const listo = Boolean(reg?.completado);
                          return (
                            <div
                              key={paso.id}
                              className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                                listo ? 'border-[#A7F3D0] bg-[#ECFDF5]/50' : 'border-[#EFECE6] bg-[#FBF9F5]'
                              }`}
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2 font-bold text-[#1C1917]">
                                  {listo ? (
                                    <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                                  ) : (
                                    <span className="w-4 h-4 rounded-full border border-[#A8A29E] inline-block shrink-0" />
                                  )}
                                  <span>
                                    Paso {idx + 1}: {paso.titulo}
                                  </span>
                                </div>
                                {reg?.nota_familiar && (
                                  <p className="text-[11px] text-[#065F46] font-semibold pl-6">
                                    📝 Bitácora familiar: «{reg.nota_familiar}»
                                  </p>
                                )}
                              </div>

                              <span className="text-[11px] font-bold text-[#78716C] shrink-0">
                                {listo ? '✓ Completado' : 'Pendiente'} · {reg?.intentos || 0} intento(s)
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}