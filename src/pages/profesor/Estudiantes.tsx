import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/db';
import { Perfil, Etapa, Asignacion } from '../../types/actividad';
import { UserPlus, Trash2, ClipboardCheck, GraduationCap, RefreshCw } from 'lucide-react';

const msgErr = (err: unknown) => (err instanceof Error ? err.message : 'Ocurrió un error inesperado');

export default function Estudiantes() {
  const { profile } = useAuth();
  const [estudiantes, setEstudiantes] = useState<Perfil[]>([]);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);

  // Create Student Form state
  const [nombre, setNombre] = useState('');
  const [curso, setCurso] = useState('');
  const [contrasena, setContrasena] = useState('123456'); // Default simple password

  // Assign Route state
  const [selectedEstudianteId, setSelectedEstudianteId] = useState<string | null>(null);
  const [selectedEtapaId, setSelectedEtapaId] = useState('');
  const [ajuste, setAjuste] = useState<'cognitiva' | 'motriz' | 'tea' | ''>('cognitiva');

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ error: '', success: '' });

  const loadData = async () => {
    if (!profile) return;
    try {
      const studs = await db.getEstudiantesPorProfesor(profile.id);
      setEstudiantes(studs);

      const ets = await db.getEtapas(profile.id);
      setEtapas(ets);

      const asigs = await db.getAsignacionesDeProfesor(profile.id);
      setAsignaciones(asigs);
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
      if (!nombre.trim() || !curso.trim() || !contrasena.trim()) {
        throw new Error('Todos los campos son requeridos');
      }
      await db.crearEstudiante(nombre.trim(), curso.trim(), contrasena, profile!.id);
      setMsg({ error: '', success: '¡Estudiante registrado y listo para entrar!' });
      setNombre('');
      setCurso('');
      setContrasena('123456');
      await loadData();
    } catch (err) {
      setMsg({ error: err instanceof Error ? err.message : 'Error al registrar estudiante', success: '' });
    } finally {
      setLoading(false);
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

  const getEstudianteAsignaciones = (estudianteId: string) => {
    return asignaciones.filter(a => a.estudiante_id === estudianteId);
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
                placeholder="Ej: Carlos Andrés"
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
                placeholder="Ej: 3A, 4B, etc."
                value={curso}
                onChange={(e) => setCurso(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[#EFECE6] rounded-2xl text-xs bg-[#FBF9F5] text-[#1C1917] focus:outline-none focus:border-[#EE7C6A]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#78716C] uppercase mb-1.5">Contraseña</label>
              <input
                type="password"
                placeholder="Contraseña"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
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
              <p className="text-[10px] text-[#A8A29E] font-semibold mt-1">
                El estudiante recorrerá todos sus pasos en orden, uno a la vez.
              </p>
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

      {/* Col 2 & 3: Students and active assignments */}
      <div className="bg-white p-6 rounded-[24px] border border-[#EFECE6] shadow-sm lg:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-serif-atelier font-bold text-[#1C1917] flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#EE7C6A]" /> Estudiantes Registrados ({estudiantes.length})
          </h2>
          <button
            type="button"
            onClick={loadData}
            className="p-2 border border-[#EFECE6] rounded-full hover:bg-[#F5F2EC] text-[#78716C]"
            title="Sincronizar"
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
              return (
                <div key={est.id} className="p-4 border rounded-2xl border-[#EFECE6] bg-[#FBF9F5] flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#1C1917] text-sm">{est.nombre}</span>
                      <span className="px-2.5 py-0.5 text-[11px] font-bold bg-[#EE7C6A]/10 text-[#EE7C6A] rounded-full">{est.curso}</span>
                    </div>
                    <p className="text-xs text-[#78716C] mt-1">Acceso: {est.nombre.toLowerCase().replace(/\s+/g, '-')}.{est.curso?.toLowerCase()}@inclusion.local</p>
                  </div>

                  <div className="flex-1 max-w-md">
                    <span className="block text-[10px] font-bold text-[#78716C] uppercase tracking-wider mb-2">Rutas asignadas ({activeAsigs.length})</span>
                    {activeAsigs.length === 0 ? (
                      <span className="text-xs font-bold text-[#B45309] bg-[#FFF8F0] px-2.5 py-1 rounded-full border border-[#FFE8D0]">Sin rutas</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {activeAsigs.map((asig) => {
                          const etapa = etapas.find(e => e.id === asig.etapa_id);
                          if (!etapa) return null;
                          return (
                            <div key={asig.id} className="flex items-center gap-1.5 px-3 py-1 bg-white border border-[#EFECE6] rounded-full shadow-sm text-xs font-bold text-[#1C1917]">
                              <span className="truncate max-w-[180px]">{etapa.nombre}</span>
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}