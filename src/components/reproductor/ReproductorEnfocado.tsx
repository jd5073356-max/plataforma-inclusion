import React, { useState, useRef } from 'react';
import { ArrowLeft, ArrowRight, Play, Pause, Volume2, VolumeX, Maximize2, Sparkles, RotateCw } from 'lucide-react';
import { Actividad, AtelierDatoClave, AtelierHotspot } from '../../types/actividad';
import ReproductorActividad from './ReproductorActividad';

interface ReproductorEnfocadoProps {
  actividad: Actividad;
  ajuste?: 'cognitiva' | 'motriz' | 'tea';
  estudianteId: string;
  pasoActual: number; // 1-based
  totalPasos: number;
  onCompletado: () => void;
  onVolver: () => void;
  modoPreview?: boolean;
}

// Regla de oro: SOLO se muestra información que pertenece a esta actividad.
// Si un campo no existe en la actividad, el bloque no se pinta (cero relleno genérico).
export const ReproductorEnfocado: React.FC<ReproductorEnfocadoProps> = ({
  actividad,
  ajuste,
  estudianteId,
  pasoActual,
  totalPasos,
  onCompletado,
  onVolver,
  modoPreview = false
}) => {
  const [iniciado, setIniciado] = useState(false);
  const [mostrandoQuiz, setMostrandoQuiz] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(true);
  const [videoMuted, setVideoMuted] = useState(true);
  const [hotspotDestacado, setHotspotDestacado] = useState<AtelierHotspot | null>(null);
  const quizRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const atelier = actividad.atelier || {};

  // Mejor multimedia disponible: solo fuentes PROPIAS de la actividad
  const extraerMedia = (act: Actividad): { url?: string; tipo: 'video' | 'imagen' | 'ninguno' } => {
    if (act.video_url) return { url: act.video_url, tipo: 'video' };
    if (act.imagen_url) {
      const esVid = /\.(mp4|webm)$/i.test(act.imagen_url);
      return { url: act.imagen_url, tipo: esVid ? 'video' : 'imagen' };
    }
    for (const p of act.configuracion?.preguntas || []) {
      const d = p.datos as unknown as Record<string, unknown>;
      const cand = (d.video_url || d.imagenUrl || d.rostroImagenUrl) as string | undefined;
      if (cand) {
        const esVid = /\.(mp4|webm)$/i.test(cand);
        return { url: cand, tipo: esVid ? 'video' : 'imagen' };
      }
    }
    return { url: undefined, tipo: 'ninguno' };
  };

  const media = extraerMedia(actividad);
  const tieneMedia = media.tipo !== 'ninguno' && !!media.url;

  const hotspots: AtelierHotspot[] = atelier.hotspots || [];
  const datosClave: AtelierDatoClave[] = atelier.datosClave || [];
  const tipoLabel = actividad.tipo.replace(/_/g, ' ');

  const iniciarQuiz = () => {
    setMostrandoQuiz(true);
    setIniciado(true);
    setTimeout(() => quizRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1C1917] font-sans-atelier">
      {/* Barra superior: volver + progreso del paso en la ruta */}
      <header className="sticky top-0 z-40 bg-[#FBF9F5]/90 backdrop-blur-md border-b border-[#EFECE6] px-4 md:px-6 py-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onVolver}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#EFECE6] rounded-full text-xs font-bold text-[#57534E] hover:bg-[#F5F2EC] transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a la ruta
        </button>

        <div className="flex items-center gap-3">
          {modoPreview && (
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-[#F5F2EC] text-[#57534E] border border-[#EBE8E0]">
              Vista previa
            </span>
          )}
          <span className="text-xs font-bold text-[#78716C] bg-white border border-[#EFECE6] px-3.5 py-1.5 rounded-full">
            Paso <b className="text-[#1C1917]">{pasoActual}</b> de {totalPasos}
          </span>
        </div>
      </header>

      <main className="max-w-6xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Título de la actividad */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#EE7C6A]">{tipoLabel}</span>
            <h1 className="font-serif-atelier text-3xl md:text-4xl font-bold leading-tight mt-1">
              {actividad.titulo}
            </h1>
            {atelier.subtituloPoetico && (
              <p className="text-sm italic font-serif-atelier text-[#78716C] mt-1">{atelier.subtituloPoetico}</p>
            )}
          </div>
        </div>

        <div className={`grid grid-cols-1 gap-6 items-start ${tieneMedia ? 'lg:grid-cols-12' : ''}`}>
          {/* ZONA 1: Multimedia de la actividad (solo si la actividad trae medio propio) */}
          {tieneMedia && (
          <section className="lg:col-span-7">
            <div className="atelier-card p-2 relative min-h-[340px] overflow-hidden rounded-[24px] border border-[#EFECE6] bg-[#F7F4EE]">
              {media.tipo === 'video' ? (
                <div className="relative w-full h-full min-h-[340px] rounded-[20px] overflow-hidden bg-black flex items-center justify-center">
                  <video
                    ref={videoRef}
                    src={media.url}
                    autoPlay
                    loop
                    muted={videoMuted}
                    playsInline
                    className="w-full h-full max-h-[480px] object-contain"
                  />
                  {hotspots.map(hp => (
                    <button
                      key={hp.id}
                      type="button"
                      onClick={() => setHotspotDestacado(hp)}
                      style={{ left: `${hp.xPercent}%`, top: `${hp.yPercent}%` }}
                      className={`hotspot-dot absolute flex items-center justify-center text-[10px] font-bold text-white transition-all ${
                        hotspotDestacado?.id === hp.id ? 'scale-125 bg-[#EE7C6A] ring-4 ring-[#EE7C6A]/40' : ''
                      }`}
                      title={hp.nombre}
                    >
                      •
                    </button>
                  ))}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-black/60 backdrop-blur-md p-2 rounded-full border border-white/10 text-white z-10">
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => { const v = videoRef.current; if (!v) return; if (videoPlaying) { v.pause(); } else { v.play(); } setVideoPlaying(!videoPlaying); }} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition" title={videoPlaying ? 'Pausar' : 'Reproducir'}>
                        {videoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                      </button>
                      <button type="button" onClick={() => { const v = videoRef.current; if (!v) return; v.muted = !videoMuted; setVideoMuted(!videoMuted); }} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition" title={videoMuted ? 'Activar sonido' : 'Silenciar'}>
                        {videoMuted ? <VolumeX className="w-4 h-4 text-[#EE7C6A]" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    </div>
                    <button type="button" onClick={() => videoRef.current?.requestFullscreen?.()} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition" title="Pantalla completa">
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-full min-h-[340px] rounded-[20px] flex items-center justify-center p-4">
                  <img src={media.url} alt={actividad.titulo} className="max-h-[440px] w-auto object-contain rounded-2xl shadow-sm" />
                  {hotspots.map(hp => (
                    <button
                      key={hp.id}
                      type="button"
                      onClick={() => setHotspotDestacado(hp)}
                      style={{ left: `${hp.xPercent}%`, top: `${hp.yPercent}%` }}
                      className={`hotspot-dot absolute flex items-center justify-center text-[10px] font-bold text-white transition-all ${
                        hotspotDestacado?.id === hp.id ? 'scale-125 bg-[#EE7C6A] ring-4 ring-[#EE7C6A]/40' : ''
                      }`}
                      title={hp.nombre}
                    >
                      •
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Descripción del hotspot tocado (dato propio de la actividad) */}
            {hotspotDestacado && (
              <div className="mt-3 p-4 bg-white rounded-2xl border border-[#EFECE6] animate-slideUp">
                <p className="font-bold text-sm text-[#1C1917]">{hotspotDestacado.nombre}</p>
                <p className="text-xs text-[#57534E] mt-0.5">{hotspotDestacado.descripcion}</p>
              </div>
            )}
          </section>
          )}

          {/* ZONA 2: Ficha propia de la actividad (solo campos existentes) */}
          <aside className={`${tieneMedia ? 'lg:col-span-5' : 'lg:col-span-12'} flex flex-col gap-4`}>
            <div className="atelier-card p-6 flex flex-col gap-4">
              {atelier.resumenBreve && (
                <p className="text-sm text-[#57534E] leading-relaxed">{atelier.resumenBreve}</p>
              )}

              {datosClave.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#A8A29E] mb-3">
                    Datos clave
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {datosClave.map((item, idx) => (
                      <div key={idx} className="bg-[#FBF9F5] p-2.5 rounded-xl border border-[#F5F2EC]">
                        <span className="text-[#EE7C6A] font-bold mr-1">{item.icono}</span>
                        <span className="text-[#78716C] font-medium">{item.etiqueta}:</span>
                        <p className="font-bold text-[#1C1917] mt-0.5">{item.valor}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {atelier.importanciaEducativa && (
                <div className="bg-[#F0F7FF] border border-[#D0E2FF] p-3.5 rounded-2xl flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-[#0062FE] shrink-0 mt-0.5" />
                  <div className="text-xs text-[#002D9C]">
                    <strong className="block font-bold mb-0.5">Por qué es importante:</strong>
                    {atelier.importanciaEducativa}
                  </div>
                </div>
              )}

              {atelier.sabiasQue && (
                <div className="bg-[#FFF8F0] border border-[#FFE8D0] p-3.5 rounded-2xl flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-[#E65100] shrink-0 mt-0.5" />
                  <div className="text-xs text-[#8C2E00]">
                    <strong className="block font-bold mb-0.5">¿Sabías que...?</strong>
                    {atelier.sabiasQue}
                  </div>
                </div>
              )}

              {/* Acción principal */}
              {!mostrandoQuiz ? (
                <button
                  type="button"
                  onClick={iniciarQuiz}
                  className="w-full py-3.5 bg-[#EE7C6A] hover:bg-[#E46653] text-white font-bold text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 group"
                >
                  <span>Comenzar actividad</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => quizRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="w-full py-3 bg-[#F5F2EC] hover:bg-[#EBE8E0] text-[#57534E] font-bold text-xs rounded-2xl transition flex items-center justify-center gap-2"
                >
                  <RotateCw className="w-3.5 h-3.5" /> Ir al desafío
                </button>
              )}
            </div>
          </aside>
        </div>

        {/* ZONA 3: Desafío interactivo (aparece al comenzar) */}
        {iniciado && (
          <div ref={quizRef} className="scroll-mt-24">
            <ReproductorActividad
              actividad={actividad}
              ajuste={ajuste}
              estudianteId={estudianteId}
              onCompletado={onCompletado}
              modoPreview={modoPreview}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default ReproductorEnfocado;
