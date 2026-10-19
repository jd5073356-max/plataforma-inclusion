import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { Perfil, Etapa, Asignacion } from '../../types/actividad';
import {
  X, Check, CheckSquare, Square, Users, Save, AlertCircle, RefreshCw
} from 'lucide-react';

interface ModalAsignarEstudiantesARutaProps {
  isOpen: boolean;
  onClose: () => void;
  etapa: Etapa;
  estudiantes: Perfil[];
  asignacionesActuales: Asignacion[];
  onGuardado: () => Promise<void> | void;
}

export const ModalAsignarEstudiantesARuta: React.FC<ModalAsignarEstudiantesARutaProps> = ({
  isOpen,
  onClose,
  etapa,
  estudiantes,
  asignacionesActuales,
  onGuardado
}) => {
  const [estudiantesMap, setEstudiantesMap] = useState<
    Record<string, { asignado: boolean; ajuste?: 'cognitiva' | 'motriz' | 'tea' }>
  >({});
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState({ error: '', success: '' });

  useEffect(() => {
    if (!isOpen) return;
    const initialMap: Record<string, { asignado: boolean; ajuste?: 'cognitiva' | 'motriz' | 'tea' }> = {};
    for (const est of estudiantes) {
      const asig = asignacionesActuales.find(
        a => a.estudiante_id === est.id && a.etapa_id === etapa.id
      );
      initialMap[est.id] = {
        asignado: Boolean(asig),
        ajuste: asig?.ajuste
      };
    }
    setEstudiantesMap(initialMap);
    setMsg({ error: '', success: '' });
  }, [isOpen, etapa.id, estudiantes, asignacionesActuales]);

  if (!isOpen) return null;

  const totalAsignados = Object.values(estudiantesMap).filter(e => e.asignado).length;

  const toggleEstudiante = (estudianteId: string) => {
    setEstudiantesMap(prev => ({
      ...prev,
      [estudianteId]: {
        ...prev[estudianteId],
        asignado: !prev[estudianteId]?.asignado
      }
    }));
  };

  const cambiarAjuste = (estudianteId: string, ajuste: 'cognitiva' | 'motriz' | 'tea' | '') => {
    setEstudiantesMap(prev => ({
      ...prev,
      [estudianteId]: {
        ...prev[estudianteId],
        ajuste: ajuste === '' ? undefined : ajuste
      }
    }));
  };

  const seleccionarTodos = () => {
    setEstudiantesMap(prev => {
      const nuevo: typeof prev = {};
      for (const est of estudiantes) {
        nuevo[est.id] = {
          asignado: true,
          ajuste: prev[est.id]?.ajuste || 'motriz'
        };
      }
      return nuevo;
    });
  };

  const desmarcarTodos = () => {
    setEstudiantesMap(prev => {
      const nuevo: typeof prev = {};
      for (const est of estudiantes) {
        nuevo[est.id] = {
          asignado: false,
          ajuste: prev[est.id]?.ajuste
        };
      }
      return nuevo;
    });
  };

  const handleGuardar = async () => {
    try {
      setGuardando(true);
      setMsg({ error: '', success: '' });

      const seleccionados = Object.entries(estudiantesMap)
        .filter(([_, v]) => v.asignado)
        .map(([estudianteId, v]) => ({
          estudianteId,
          ajuste: v.ajuste
        }));

      await db.sincronizarEstudiantesDeRuta(etapa.id, seleccionados);
      setMsg({ error: '', success: `¡Ruta asignada a ${seleccionados.length} estudiante(s)!` });
      await onGuardado();
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error('Error al sincronizar estudiantes de la ruta:', err);
      setMsg({ error: err instanceof Error ? err.message : 'Error al guardar.', success: '' });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1C1917]/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans-atelier animate-fadeIn">
      <div className="bg-white rounded-[28px] max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#EFECE6] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#EFECE6] flex items-center justify-between bg-[#FBF9F5]">
          <div className="flex items-center gap-3">
            <div className="bg-[#7294B9] text-white p-2.5 rounded-2xl shadow-sm">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7294B9] block">
                Asignar Estudiantes a la Ruta
              </span>
              <h2 className="text-xl font-serif-atelier font-bold text-[#1C1917]">
                {etapa.nombre}
              </h2>
              <p className="text-xs text-[#78716C]">
                Selecciona qué estudiantes deben cursar esta ruta.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F2EC] rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 bg-[#F5F2EC]/60 border-b border-[#EFECE6] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={seleccionarTodos}
              className="px-3 py-1.5 bg-white border border-[#EFECE6] hover:bg-[#7294B9] hover:text-white rounded-full font-bold text-[#57534E] transition shadow-xs"
            >
              ✓ Marcar Todos ({estudiantes.length})
            </button>
            <button
              type="button"
              onClick={desmarcarTodos}
              className="px-3 py-1.5 bg-white border border-[#EFECE6] hover:bg-[#FFF2F0] hover:text-[#D9363E] rounded-full font-bold text-[#78716C] transition shadow-xs"
            >
              ✕ Desmarcar Todos
            </button>
          </div>

          <span className="font-bold text-[#1C1917] bg-white px-3 py-1 rounded-full border border-[#EFECE6]">
            {totalAsignados} de {estudiantes.length} estudiantes seleccionados
          </span>
        </div>

        {/* Students List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {msg.error && (
            <div className="p-3 bg-[#FFF2F0] border border-[#FFCCC7] rounded-xl text-xs font-bold text-[#D9363E] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{msg.error}</span>
            </div>
          )}
          {msg.success && (
            <div className="p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl text-xs font-bold text-[#10B981] flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{msg.success}</span>
            </div>
          )}

          {estudiantes.length === 0 ? (
            <p className="text-center text-xs text-[#78716C] py-8">
              No hay estudiantes registrados aún.
            </p>
          ) : (
            estudiantes.map((est) => {
              const info = estudiantesMap[est.id] || { asignado: false };
              const asignado = info.asignado;

              return (
                <div
                  key={est.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    asignado
                      ? 'border-[#7294B9] bg-[#F4F7FA] shadow-xs'
                      : 'border-[#EFECE6] bg-[#FBF9F5] opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div
                      className="flex items-start gap-3 cursor-pointer flex-1 select-none"
                      onClick={() => toggleEstudiante(est.id)}
                    >
                      <button
                        type="button"
                        className="mt-0.5 text-[#7294B9] shrink-0"
                      >
                        {asignado ? (
                          <CheckSquare className="w-5 h-5 fill-[#7294B9] text-white" />
                        ) : (
                          <Square className="w-5 h-5 text-[#A8A29E]" />
                        )}
                      </button>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-[#1C1917]">
                            {est.nombre}
                          </h4>
                          <span className="text-[10px] font-bold uppercase text-[#7294B9] bg-white px-2 py-0.5 rounded-full border border-[#EFECE6]">
                            Curso {est.curso}
                          </span>
                        </div>
                      </div>
                    </div>

                    {asignado && (
                      <div className="flex items-center gap-1.5 pl-8 sm:pl-0">
                        <label className="text-[10px] font-bold uppercase text-[#78716C] shrink-0">
                          Ajuste:
                        </label>
                        <select
                          value={info.ajuste || ''}
                          onChange={(e) => cambiarAjuste(est.id, e.target.value as any)}
                          className="text-xs font-bold px-2.5 py-1.5 bg-white border border-[#EFECE6] rounded-xl text-[#1C1917] focus:outline-none focus:border-[#7294B9]"
                        >
                          <option value="motriz">Motriz (Tablet asistida)</option>
                          <option value="cognitiva">Cognitiva (TTS y pictogramas)</option>
                          <option value="tea">TEA (Sin animaciones)</option>
                          <option value="">Estándar</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#EFECE6] bg-[#FBF9F5] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full border border-[#EFECE6] bg-white text-[#57534E] hover:bg-[#F5F2EC] text-xs font-bold transition"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleGuardar}
            disabled={guardando}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#7294B9] hover:bg-[#5C7D9E] text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
          >
            {guardando ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Asignar esta ruta a {totalAsignados} estudiante(s)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalAsignarEstudiantesARuta;
