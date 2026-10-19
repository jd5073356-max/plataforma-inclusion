import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { Perfil, Etapa, Asignacion } from '../../types/actividad';
import {
  X, Check, CheckSquare, Square, Eye, ShieldCheck, MapPin,
  Sparkles, Save, AlertCircle, RefreshCw
} from 'lucide-react';

interface RutaSeleccionada {
  etapaId: string;
  ajuste?: 'cognitiva' | 'motriz' | 'tea';
}

interface ModalGestionarRutasEstudianteProps {
  isOpen: boolean;
  onClose: () => void;
  estudiante: Perfil;
  etapas: Etapa[];
  asignacionesActuales: Asignacion[];
  onGuardado: () => Promise<void> | void;
  onPrevisualizarRuta?: (etapa: Etapa) => void;
}

export const ModalGestionarRutasEstudiante: React.FC<ModalGestionarRutasEstudianteProps> = ({
  isOpen,
  onClose,
  estudiante,
  etapas,
  asignacionesActuales,
  onGuardado,
  onPrevisualizarRuta
}) => {
  const [rutasMap, setRutasMap] = useState<Record<string, { asignada: boolean; ajuste?: 'cognitiva' | 'motriz' | 'tea' }>>({});
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState({ error: '', success: '' });

  useEffect(() => {
    if (!isOpen) return;
    const initialMap: Record<string, { asignada: boolean; ajuste?: 'cognitiva' | 'motriz' | 'tea' }> = {};
    for (const etapa of etapas) {
      const asig = asignacionesActuales.find(
        a => a.estudiante_id === estudiante.id && a.etapa_id === etapa.id
      );
      initialMap[etapa.id] = {
        asignada: Boolean(asig),
        ajuste: asig?.ajuste
      };
    }
    setRutasMap(initialMap);
    setMsg({ error: '', success: '' });
  }, [isOpen, estudiante.id, etapas, asignacionesActuales]);

  if (!isOpen) return null;

  const totalAsignadas = Object.values(rutasMap).filter(r => r.asignada).length;

  const toggleRuta = (etapaId: string) => {
    setRutasMap(prev => ({
      ...prev,
      [etapaId]: {
        ...prev[etapaId],
        asignada: !prev[etapaId]?.asignada
      }
    }));
  };

  const cambiarAjuste = (etapaId: string, ajuste: 'cognitiva' | 'motriz' | 'tea' | '') => {
    setRutasMap(prev => ({
      ...prev,
      [etapaId]: {
        ...prev[etapaId],
        ajuste: ajuste === '' ? undefined : ajuste
      }
    }));
  };

  const seleccionarTodas = () => {
    setRutasMap(prev => {
      const nuevo: typeof prev = {};
      for (const et of etapas) {
        nuevo[et.id] = {
          asignada: true,
          ajuste: prev[et.id]?.ajuste || 'motriz'
        };
      }
      return nuevo;
    });
  };

  const desmarcarTodas = () => {
    setRutasMap(prev => {
      const nuevo: typeof prev = {};
      for (const et of etapas) {
        nuevo[et.id] = {
          asignada: false,
          ajuste: prev[et.id]?.ajuste
        };
      }
      return nuevo;
    });
  };

  const handleGuardar = async () => {
    try {
      setGuardando(true);
      setMsg({ error: '', success: '' });

      const seleccionadas: RutaSeleccionada[] = Object.entries(rutasMap)
        .filter(([_, v]) => v.asignada)
        .map(([etapaId, v]) => ({
          etapaId,
          ajuste: v.ajuste
        }));

      await db.sincronizarRutasEstudiante(estudiante.id, seleccionadas);
      setMsg({ error: '', success: `¡Se asignaron ${seleccionadas.length} ruta(s) a ${estudiante.nombre} con éxito!` });
      await onGuardado();
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error('Error al sincronizar rutas del estudiante:', err);
      setMsg({ error: err instanceof Error ? err.message : 'Error al guardar las rutas.', success: '' });
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
            <div className="bg-[#EE7C6A] text-white p-2.5 rounded-2xl shadow-sm">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#EE7C6A] block">
                Asignación de Múltiples Rutas
              </span>
              <h2 className="text-xl font-serif-atelier font-bold text-[#1C1917]">
                {estudiante.nombre}
              </h2>
              <p className="text-xs text-[#78716C]">
                Curso: <span className="font-bold text-[#1C1917]">{estudiante.curso}</span> · Elige todas las rutas que debe cursar.
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
              onClick={seleccionarTodas}
              className="px-3 py-1.5 bg-white border border-[#EFECE6] hover:bg-[#EE7C6A] hover:text-white rounded-full font-bold text-[#57534E] transition shadow-xs"
            >
              ✓ Marcar Todas ({etapas.length})
            </button>
            <button
              type="button"
              onClick={desmarcarTodas}
              className="px-3 py-1.5 bg-white border border-[#EFECE6] hover:bg-[#FFF2F0] hover:text-[#D9363E] rounded-full font-bold text-[#78716C] transition shadow-xs"
            >
              ✕ Desmarcar Todas
            </button>
          </div>

          <span className="font-bold text-[#1C1917] bg-white px-3 py-1 rounded-full border border-[#EFECE6]">
            {totalAsignadas} de {etapas.length} rutas seleccionadas
          </span>
        </div>

        {/* Routes List */}
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

          {etapas.length === 0 ? (
            <p className="text-center text-xs text-[#78716C] py-8">
              No hay rutas registradas en el sistema.
            </p>
          ) : (
            etapas.map((etapa) => {
              const info = rutasMap[etapa.id] || { asignada: false };
              const asignada = info.asignada;

              return (
                <div
                  key={etapa.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    asignada
                      ? 'border-[#EE7C6A] bg-[#FFF8F7] shadow-xs'
                      : 'border-[#EFECE6] bg-[#FBF9F5] opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div
                      className="flex items-start gap-3 cursor-pointer flex-1 select-none"
                      onClick={() => toggleRuta(etapa.id)}
                    >
                      <button
                        type="button"
                        className="mt-0.5 text-[#EE7C6A] shrink-0"
                      >
                        {asignada ? (
                          <CheckSquare className="w-5 h-5 fill-[#EE7C6A] text-white" />
                        ) : (
                          <Square className="w-5 h-5 text-[#A8A29E]" />
                        )}
                      </button>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold uppercase text-[#78716C] bg-[#EFECE6] px-2 py-0.5 rounded-full">
                            Ruta #{etapa.orden}
                          </span>
                          <h4 className="font-bold text-sm text-[#1C1917]">
                            {etapa.nombre}
                          </h4>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pl-8 sm:pl-0">
                      {/* Accesibilidad */}
                      {asignada && (
                        <div className="flex items-center gap-1.5">
                          <label className="text-[10px] font-bold uppercase text-[#78716C] shrink-0">
                            Ajuste:
                          </label>
                          <select
                            value={info.ajuste || ''}
                            onChange={(e) => cambiarAjuste(etapa.id, e.target.value as any)}
                            className="text-xs font-bold px-2.5 py-1.5 bg-white border border-[#EFECE6] rounded-xl text-[#1C1917] focus:outline-none focus:border-[#EE7C6A]"
                          >
                            <option value="motriz">Motriz (Tablet asistida)</option>
                            <option value="cognitiva">Cognitiva (TTS y pictogramas)</option>
                            <option value="tea">TEA (Sin animaciones)</option>
                            <option value="">Estándar</option>
                          </select>
                        </div>
                      )}

                      {/* Preview Button */}
                      {onPrevisualizarRuta && (
                        <button
                          type="button"
                          onClick={() => onPrevisualizarRuta(etapa)}
                          className="p-1.5 text-[#57534E] hover:text-[#EE7C6A] hover:bg-white rounded-xl border border-transparent hover:border-[#EFECE6] transition"
                          title="Previsualizar actividades de esta ruta"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                    </div>
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
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#EE7C6A] hover:bg-[#E46653] text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
          >
            {guardando ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Guardar {totalAsignadas} Ruta(s) para {estudiante.nombre}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalGestionarRutasEstudiante;
