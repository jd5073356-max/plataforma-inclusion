import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { Etapa, Actividad } from '../../types/actividad';
import ReproductorEnfocado from '../reproductor/ReproductorEnfocado';
import {
  X, Play, Volume2, Mic, Image as ImageIcon, Video, HelpCircle,
  Layers, ChevronRight, ChevronLeft, CheckCircle2, Sparkles, Eye
} from 'lucide-react';

interface ModalPrevisualizarRutaProps {
  etapa: Etapa | { id: string; nombre: string; orden?: number };
  isOpen: boolean;
  onClose: () => void;
  pasoInicialIdx?: number;
}

const tipoEmoji = (tipo: string): string => {
  const mapa: Record<string, string> = {
    seleccion: '✅',
    emparejar: '🔗',
    clasificar: '🗂️',
    completar: '🧩',
    escuchar_responder: '🎧',
    ordenar: '🔢',
    memoria: '🃏',
    identificar: '🔍',
    trazar_colorear: '🎨',
    reconocer_emociones: '😊',
    autoevaluacion: '🌟'
  };
  return mapa[tipo] || '⭐';
};

export const ModalPrevisualizarRuta: React.FC<ModalPrevisualizarRutaProps> = ({
  etapa,
  isOpen,
  onClose,
  pasoInicialIdx = 0
}) => {
  const [pasos, setPasos] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'lista' | 'interactivo'>('interactivo');
  const [pasoActualIdx, setPasoActualIdx] = useState(pasoInicialIdx);

  useEffect(() => {
    if (!isOpen || !etapa?.id) return;
    const cargar = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await db.getPasosDeEtapa(etapa.id);
        const ordenados = [...data].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
        setPasos(ordenados);
        setPasoActualIdx(Math.min(pasoInicialIdx, Math.max(0, ordenados.length - 1)));
      } catch (err) {
        console.error('Error cargando actividades de la ruta:', err);
        setError('No se pudieron cargar las actividades de esta ruta.');
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [isOpen, etapa?.id, pasoInicialIdx]);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalPasos = pasos.length;
  const pasoActivo = pasos[pasoActualIdx];
  const totalPreguntas = pasos.reduce((acc, p) => acc + (p.configuracion?.preguntas?.length || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-[#1C1917]/70 backdrop-blur-sm flex flex-col font-sans-atelier overflow-hidden animate-fadeIn">
      {/* Header Sticky */}
      <header className="bg-white border-b border-[#EFECE6] px-5 py-3.5 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="bg-[#EE7C6A]/10 text-[#EE7C6A] p-2 rounded-2xl shrink-0">
            <Eye className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#F5F2EC] text-[#78716C] px-2.5 py-0.5 rounded-full">
                Previsualización de Ruta
              </span>
              <span className="text-xs font-bold text-[#EE7C6A]">
                {totalPasos} actividades · {totalPreguntas} preguntas
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-serif-atelier font-bold text-[#1C1917] truncate">
              {etapa.nombre}
            </h2>
          </div>
        </div>

        {/* View Switcher & Close */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-[#F5F2EC] p-1 rounded-full flex items-center gap-1 border border-[#EFECE6]">
            <button
              type="button"
              onClick={() => setTab('interactivo')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                tab === 'interactivo'
                  ? 'bg-white text-[#1C1917] shadow-sm'
                  : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Modo Interactivo</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('lista')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                tab === 'lista'
                  ? 'bg-white text-[#1C1917] shadow-sm'
                  : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lista de Actividades</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F2EC] rounded-full transition border border-transparent hover:border-[#EFECE6]"
            title="Cerrar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto bg-[#FBF9F5] flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="w-10 h-10 border-4 border-[#EE7C6A] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-xs font-bold text-[#78716C]">Cargando actividades de la ruta...</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="bg-white p-6 rounded-2xl border border-[#FFCCC7] text-center max-w-md shadow-sm">
              <p className="text-sm font-bold text-[#D9363E] mb-3">{error}</p>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#F5F2EC] hover:bg-[#EBE8E0] text-xs font-bold rounded-full transition"
              >
                Volver
              </button>
            </div>
          </div>
        ) : pasos.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="bg-white p-8 rounded-[24px] border border-dashed border-[#EFECE6] text-center max-w-md shadow-sm">
              <Layers className="w-12 h-12 text-[#A8A29E] mx-auto mb-3 opacity-50" />
              <h3 className="text-base font-serif-atelier font-bold text-[#1C1917] mb-1">Ruta sin actividades aún</h3>
              <p className="text-xs text-[#78716C] mb-4">
                Esta ruta no tiene pasos registrados. Puedes crearlos en el creador de actividades o reciclar desde el Banco.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-[#EE7C6A] text-white text-xs font-bold rounded-full transition shadow-sm"
              >
                Entendido
              </button>
            </div>
          </div>
        ) : tab === 'interactivo' ? (
          /* MODO INTERACTIVO */
          <div className="flex-1 flex flex-col">
            {/* Horizontal Step Navigator Bar */}
            <div className="bg-white/95 border-b border-[#EFECE6] px-4 py-2.5 flex items-center justify-between gap-3 sticky top-0 z-30 shadow-xs backdrop-blur-md overflow-x-auto">
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setPasoActualIdx(prev => Math.max(0, prev - 1))}
                  disabled={pasoActualIdx === 0}
                  className="p-1.5 rounded-full hover:bg-[#F5F2EC] text-[#57534E] disabled:opacity-20 transition"
                  title="Paso anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-[#1C1917]">
                  Paso {pasoActualIdx + 1} de {totalPasos}
                </span>
                <button
                  type="button"
                  onClick={() => setPasoActualIdx(prev => Math.min(totalPasos - 1, prev + 1))}
                  disabled={pasoActualIdx === totalPasos - 1}
                  className="p-1.5 rounded-full hover:bg-[#F5F2EC] text-[#57534E] disabled:opacity-20 transition"
                  title="Paso siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Step pills */}
              <div className="flex items-center gap-2 overflow-x-auto py-1 px-1">
                {pasos.map((paso, idx) => {
                  const activo = idx === pasoActualIdx;
                  const tieneAudio = paso.configuracion?.preguntas?.some(
                    p => Boolean((p.datos as any)?.audioUrl)
                  );
                  return (
                    <button
                      key={paso.id}
                      type="button"
                      onClick={() => setPasoActualIdx(idx)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition shrink-0 ${
                        activo
                          ? 'bg-[#EE7C6A] text-white shadow-sm ring-2 ring-[#EE7C6A]/20'
                          : 'bg-[#FBF9F5] hover:bg-[#F5F2EC] text-[#57534E] border border-[#EFECE6]'
                      }`}
                    >
                      <span>{tipoEmoji(paso.tipo)}</span>
                      <span>#{idx + 1}</span>
                      <span className="truncate max-w-[120px]">{paso.titulo}</span>
                      {tieneAudio && (
                        <span className={`text-[9px] px-1 py-0.2 rounded-full ${activo ? 'bg-white/20 text-white' : 'bg-[#ECFDF5] text-[#065F46]'}`}>
                          🎙️
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="shrink-0 text-right hidden md:block">
                <span className="text-[11px] font-bold text-[#78716C]">
                  {pasoActivo.configuracion?.preguntas?.length || 0} pregunta(s)
                </span>
              </div>
            </div>

            {/* Interactive Player */}
            <div className="flex-1">
              <ReproductorEnfocado
                key={pasoActivo.id}
                actividad={pasoActivo}
                estudianteId="preview"
                pasoActual={pasoActualIdx + 1}
                totalPasos={totalPasos}
                onCompletado={() => {
                  if (pasoActualIdx < totalPasos - 1) {
                    setPasoActualIdx(pasoActualIdx + 1);
                  } else {
                    alert('🎉 ¡Has completado todos los pasos de la ruta en la vista previa!');
                  }
                }}
                onVolver={() => {
                  if (pasoActualIdx > 0) {
                    setPasoActualIdx(pasoActualIdx - 1);
                  } else {
                    onClose();
                  }
                }}
                modoPreview={true}
              />
            </div>
          </div>
        ) : (
          /* MODO LISTA DE ACTIVIDADES */
          <div className="max-w-5xl w-full mx-auto p-6 md:p-8 space-y-6">
            <div className="bg-white p-6 rounded-[24px] border border-[#EFECE6] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#EE7C6A]">
                  Plan de actividades
                </span>
                <h3 className="text-2xl font-serif-atelier font-bold text-[#1C1917]">
                  {etapa.nombre}
                </h3>
                <p className="text-xs text-[#78716C] mt-1">
                  Revisa el orden, las mecánicas, los audios y el contenido pedagógico de cada actividad.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPasoActualIdx(0);
                  setTab('interactivo');
                }}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-[#EE7C6A] hover:bg-[#E46653] text-white font-bold text-xs rounded-full transition shadow-sm shrink-0"
              >
                <Play className="w-4 h-4 fill-current" /> Comenzar Vista Previa Interactiva
              </button>
            </div>

            {/* Grid of activities */}
            <div className="space-y-4">
              {pasos.map((paso, idx) => {
                const pregs = paso.configuracion?.preguntas || [];
                const tieneAudio = pregs.some(p => Boolean((p.datos as any)?.audioUrl));
                const audioUrl = (pregs[0]?.datos as any)?.audioUrl as string | undefined;

                return (
                  <div
                    key={paso.id}
                    className="bg-white rounded-[20px] border border-[#EFECE6] shadow-xs p-5 hover:shadow-md transition space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-2xl bg-[#EE7C6A] text-white flex items-center justify-center font-serif-atelier font-bold text-sm shadow-xs shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-[#1C1917] flex items-center gap-1">
                              {tipoEmoji(paso.tipo)} {paso.tipo.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[11px] font-bold text-[#78716C] bg-[#F5F2EC] px-2.5 py-0.5 rounded-full">
                              {pregs.length} pregunta(s)
                            </span>
                            {tieneAudio && (
                              <span className="text-[11px] font-bold text-[#065F46] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-[#A7F3D0]">
                                <Mic className="w-3 h-3" /> Audio del profesor disponible
                              </span>
                            )}
                            {paso.video_url && (
                              <span className="text-[11px] font-bold text-[#1E40AF] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <Video className="w-3 h-3" /> Video incluido
                              </span>
                            )}
                          </div>
                          <h4 className="text-base font-bold text-[#1C1917] mt-0.5">
                            {paso.titulo}
                          </h4>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setPasoActualIdx(idx);
                          setTab('interactivo');
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#FBF9F5] hover:bg-[#EE7C6A] text-[#57534E] hover:text-white border border-[#EFECE6] hover:border-[#EE7C6A] rounded-full text-xs font-bold transition shadow-xs self-start sm:self-center shrink-0"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" /> Probar paso #{idx + 1}
                      </button>
                    </div>

                    {/* Audio Player if available */}
                    {audioUrl && (
                      <div className="p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl flex items-center gap-3">
                        <div className="bg-[#10B981] p-1.5 rounded-full text-white shrink-0">
                          <Volume2 className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold uppercase text-[#065F46] block">
                            Audio grabado para los estudiantes
                          </span>
                          <audio controls src={audioUrl} className="h-8 w-full max-w-md mt-1" />
                        </div>
                      </div>
                    )}

                    {/* Questions snippet */}
                    {pregs.length > 0 && (
                      <div className="bg-[#FBF9F5] p-3.5 rounded-xl border border-[#EFECE6] space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#78716C] block">
                          Contenido de las preguntas:
                        </span>
                        <ul className="space-y-1.5">
                          {pregs.map((preg, pIdx) => {
                            const d = (preg.datos || {}) as any;
                            const texto = d.enunciado || d.pregunta || d.titulo || 'Actividad práctica guiada';
                            return (
                              <li key={d.id || pIdx} className="text-xs text-[#44403C] flex items-start gap-2">
                                <span className="font-bold text-[#EE7C6A] shrink-0">P{pIdx + 1}.</span>
                                <span className="font-medium">{texto}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModalPrevisualizarRuta;
