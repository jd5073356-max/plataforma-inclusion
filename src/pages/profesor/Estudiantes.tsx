import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/db';
import { Perfil, Actividad, Asignacion } from '../../types/actividad';
import { UserPlus, UserCheck, Plus, Trash2, Award, ClipboardCheck, GraduationCap, ArrowRight, Settings, AlertCircle, RefreshCw } from 'lucide-react';

export default function Estudiantes() {
  const { profile } = useAuth();
  const [estudiantes, setEstudiantes] = useState<Perfil[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  
  // Create Student Form state
  const [nombre, setNombre] = useState('');
  const [curso, setCurso] = useState('');
  const [contrasena, setContrasena] = useState('123456'); // Default simple password
  
  // Assign Activity state
  const [selectedEstudianteId, setSelectedEstudianteId] = useState<string | null>(null);
  const [selectedActividadId, setSelectedActividadId] = useState('');
  const [ajuste, setAjuste] = useState<'cognitiva' | 'motriz' | 'tea' | ''>('cognitiva');

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ error: '', success: '' });

  const loadData = async () => {
    if (!profile) return;
    try {
      const studs = await db.getEstudiantesPorProfesor(profile.id);
      setEstudiantes(studs);
      
      const acts = await db.getActividades(profile.id);
      setActividades(acts);

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
    } catch (err: any) {
      setMsg({ error: err.message || 'Error al registrar estudiante', success: '' });
    } finally {
      setLoading(false);
    }
  };

  const handleAsignar = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({ error: '', success: '' });
    if (!selectedEstudianteId || !selectedActividadId) {
      setMsg({ error: 'Debes seleccionar un estudiante y una actividad', success: '' });
      return;
    }

    try {
      await db.asignarActividad(selectedEstudianteId, selectedActividadId, ajuste || undefined);
      setMsg({ error: '', success: 'Actividad asignada correctamente.' });
      setSelectedActividadId('');
      await loadData();
    } catch (err: any) {
      setMsg({ error: err.message || 'Error al asignar', success: '' });
    }
  };

  const handleDesasignar = async (estudianteId: string, actividadId: string) => {
    try {
      await db.desasignarActividad(estudianteId, actividadId);
      await loadData();
    } catch (err) {
      console.error('Error al desasignar:', err);
    }
  };

  const getEstudianteAsignaciones = (estudianteId: string) => {
    return asignaciones.filter(a => a.estudiante_id === estudianteId);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Col 1: Add Student & Quick Assignment */}
      <div className="space-y-8">
        {/* Formulario Estudiante */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border dark:border-gray-700 shadow-sm">
          <h2 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" /> Registrar Estudiante
          </h2>
          <form onSubmit={handleCrearEstudiante} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Nombre Completo</label>
              <input
                type="text"
                placeholder="Ej: Mateo Gómez"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-sm bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Curso o Nivel</label>
              <input
                type="text"
                placeholder="Ej: 3A, 4B, etc."
                value={curso}
                onChange={(e) => setCurso(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-sm bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Contraseña</label>
              <input
                type="password"
                placeholder="Contraseña"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-sm bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            {msg.success && <p className="text-xs text-green-600 font-bold bg-green-50 p-2.5 rounded-lg">{msg.success}</p>}
            {msg.error && <p className="text-xs text-red-600 font-bold bg-red-50 p-2.5 rounded-lg">{msg.error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition text-sm"
            >
              Registrar Estudiante
            </button>
          </form>
        </div>

        {/* Asignación de Actividades */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border dark:border-gray-700 shadow-sm">
          <h2 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-purple-600" /> Asignar Actividad
          </h2>
          <form onSubmit={handleAsignar} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Estudiante</label>
              <select
                value={selectedEstudianteId || ''}
                onChange={(e) => setSelectedEstudianteId(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-sm bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                required
              >
                <option value="">Selecciona un estudiante</option>
                {estudiantes.map(est => (
                  <option key={est.id} value={est.id}>{est.nombre} ({est.curso})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Actividad</label>
              <select
                value={selectedActividadId}
                onChange={(e) => setSelectedActividadId(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-sm bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                required
              >
                <option value="">Selecciona actividad</option>
                {actividades.map(act => (
                  <option key={act.id} value={act.id}>{act.titulo} [{act.tipo.toUpperCase()}]</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Ajuste de Accesibilidad</label>
              <select
                value={ajuste}
                onChange={(e) => setAjuste(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-xl text-sm bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
              >
                <option value="cognitiva">Cognitivo (Instrucciones cortas, pictogramas, TTS)</option>
                <option value="motriz">Motriz (Zonas de click gigantes, sin arrastrar)</option>
                <option value="tea">TEA (Layout simple y predecible, cero animaciones)</option>
                <option value="">Ninguno (Estándar)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition text-sm"
            >
              Asignar Actividad
            </button>
          </form>
        </div>
      </div>

      {/* Col 2 & 3: Students and active assignments */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border dark:border-gray-700 shadow-sm lg:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600" /> Estudiantes Registrados ({estudiantes.length})
          </h2>
          <button
            type="button"
            onClick={loadData}
            className="p-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500"
            title="Sincronizar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {estudiantes.length === 0 ? (
          <div className="text-center py-16 border border-dashed rounded-xl border-gray-300 dark:border-gray-600">
            <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-gray-500">Aún no has registrado ningún estudiante.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {estudiantes.map((est) => {
              const activeAsigs = getEstudianteAsignaciones(est.id);
              return (
                <div key={est.id} className="p-4 border rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-base text-gray-900 dark:text-white">{est.nombre}</span>
                      <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 rounded-full">{est.curso}</span>
                    </div>
                    <p className="text-xs font-semibold text-gray-400 mt-1">Correo sintético: {est.nombre.toLowerCase().replace(/\s+/g, '-')}.{est.curso?.toLowerCase()}@inclusion.local</p>
                  </div>

                  <div className="flex-1 max-w-md">
                    <span className="block text-xs font-bold text-gray-400 uppercase mb-2">Actividades Asignadas ({activeAsigs.length})</span>
                    {activeAsigs.length === 0 ? (
                      <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-md">Sin actividades</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {activeAsigs.map((asig) => {
                          const act = actividades.find(a => a.id === asig.actividad_id);
                          if (!act) return null;
                          return (
                            <div key={asig.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-sm text-xs font-bold text-gray-700 dark:text-gray-300">
                              <span className="truncate max-w-[120px]">{act.titulo}</span>
                              {asig.ajuste && (
                                <span className={`px-1 py-0.2 rounded-md text-[9px] uppercase font-black ${
                                  asig.ajuste === 'cognitiva' ? 'bg-amber-100 text-amber-800' : asig.ajuste === 'motriz' ? 'bg-purple-100 text-purple-800' : 'bg-sky-100 text-sky-800'
                                }`}>
                                  {asig.ajuste}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDesasignar(est.id, asig.actividad_id)}
                                className="text-gray-400 hover:text-red-500 rounded p-0.5 transition"
                                title="Desasignar"
                              >
                                <Trash2 className="w-3 h-3" />
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