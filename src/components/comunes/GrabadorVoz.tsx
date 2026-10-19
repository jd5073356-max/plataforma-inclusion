import React, { useState, useEffect } from 'react';
import { Mic, Square, RotateCcw, Check, Upload, Volume2, Trash2, Music } from 'lucide-react';
import { useGrabadora } from '../../hooks/useGrabadora';

const AUDIOS_BIBLIOTECA = [
  { nombre: '🐦 Canto de pájaro', url: '/multimedia/audios/pajaro.wav' },
  { nombre: '💧 Agua corriendo', url: '/multimedia/audios/agua_corriendo.wav' },
  { nombre: '🔔 Sonido de campana', url: '/multimedia/audios/campana.wav' },
  { nombre: '🌧️ Lluvia andina', url: '/multimedia/audios/lluvia.wav' },
  { nombre: '🌬️ Viento fresco', url: '/multimedia/audios/viento.wav' },
  { nombre: '🎵 Música relajante', url: '/multimedia/audios/musica_relajante.wav' }
];

interface GrabadorVozProps {
  onSave: (blobOrFile: Blob | File) => Promise<void> | void;
  onSelectUrl?: (url: string) => void;
  currentAudioUrl?: string;
  label?: string;
}

export const GrabadorVoz: React.FC<GrabadorVozProps> = ({
  onSave,
  onSelectUrl,
  currentAudioUrl,
  label = '🎙️ Grabar instrucción de voz o sonido para el estudiante'
}) => {
  const { recording, audioUrl, audioBlob, startRecording, stopRecording, resetRecording } = useGrabadora();
  const [seconds, setSeconds] = useState(0);
  const [modo, setModo] = useState<'mic' | 'archivo' | 'biblioteca'>('mic');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let interval: any;
    if (recording) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      setSeconds(0);
    }
    return () => clearInterval(interval);
  }, [recording]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSave = async () => {
    if (audioBlob) {
      try {
        setGuardando(true);
        await onSave(audioBlob);
        resetRecording();
      } finally {
        setGuardando(false);
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        setGuardando(true);
        await onSave(e.target.files[0]);
      } finally {
        setGuardando(false);
      }
    }
  };

  return (
    <div className="p-4 border-2 border-[#EFECE6] rounded-2xl bg-[#FBF9F5] space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold text-[#1C1917] uppercase tracking-wider flex items-center gap-1.5">
          <Volume2 className="w-4 h-4 text-[#EE7C6A]" /> {label}
        </span>

        {/* Selector de modo */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#EFECE6]">
          <button
            type="button"
            onClick={() => setModo('mic')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
              modo === 'mic' ? 'bg-[#EE7C6A] text-white' : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            <Mic className="w-3 h-3" /> Micrófono
          </button>
          <button
            type="button"
            onClick={() => setModo('archivo')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
              modo === 'archivo' ? 'bg-[#EE7C6A] text-white' : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            <Upload className="w-3 h-3" /> Subir audio
          </button>
          {onSelectUrl && (
            <button
              type="button"
              onClick={() => setModo('biblioteca')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                modo === 'biblioteca' ? 'bg-[#EE7C6A] text-white' : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              <Music className="w-3 h-3" /> Sonidos aula
            </button>
          )}
        </div>
      </div>

      {/* Audio actualmente guardado en la pregunta */}
      {currentAudioUrl && (
        <div className="p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-xs font-extrabold text-[#065F46] shrink-0">✓ Audio activo:</span>
            <audio src={currentAudioUrl} controls className="h-9 w-full max-w-xs" />
          </div>
          {onSelectUrl && (
            <button
              type="button"
              onClick={() => onSelectUrl('')}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-[#D9363E] hover:bg-[#FFF2F0] rounded-lg transition"
              title="Quitar audio"
            >
              <Trash2 className="w-3.5 h-3.5" /> Quitar
            </button>
          )}
        </div>
      )}

      {/* MODO 1: GRABAR CON MICRÓFONO */}
      {modo === 'mic' && (
        <div className="flex flex-wrap items-center gap-3">
          {!recording && !audioUrl && (
            <button
              type="button"
              onClick={startRecording}
              disabled={guardando}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#EE7C6A] hover:bg-[#E46653] text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Mic className="w-4 h-4 animate-pulse" />
              Grabar mi voz ahora
            </button>
          )}

          {recording && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={stopRecording}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1C1917] hover:bg-[#292524] text-white rounded-xl text-xs font-bold transition animate-pulse"
              >
                <Square className="w-4 h-4 text-[#EE7C6A] fill-current" />
                Detener grabación ({formatTime(seconds)})
              </button>
              <span className="flex items-center gap-1.5 text-xs font-bold text-[#D9363E]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D9363E] animate-ping" /> Grabando...
              </span>
            </div>
          )}

          {audioUrl && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full bg-white p-3 rounded-xl border border-[#EFECE6]">
              <audio src={audioUrl} controls className="h-9 flex-1" />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetRecording}
                  disabled={guardando}
                  className="p-2 text-[#78716C] hover:text-[#D9363E] hover:bg-[#FFF2F0] rounded-xl transition"
                  title="Descartar y volver a grabar"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={guardando}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#10B981] hover:bg-[#0EA371] text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  {guardando ? 'Guardando audio...' : 'Confirmar y Usar Audio'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODO 2: SUBIR ARCHIVO DE AUDIO */}
      {modo === 'archivo' && (
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#EFECE6] hover:border-[#EE7C6A] rounded-xl cursor-pointer text-xs font-bold text-[#1C1917] transition shadow-sm">
            <Upload className="w-4 h-4 text-[#EE7C6A]" />
            {guardando ? 'Subiendo archivo de audio...' : 'Seleccionar archivo MP3, WAV o M4A'}
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              disabled={guardando}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* MODO 3: BIBLIOTECA DE SONIDOS DEL AULA */}
      {modo === 'biblioteca' && onSelectUrl && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {AUDIOS_BIBLIOTECA.map((item) => {
            const activo = currentAudioUrl === item.url;
            return (
              <button
                key={item.url}
                type="button"
                onClick={() => onSelectUrl(item.url)}
                className={`p-2.5 rounded-xl border text-left text-xs font-bold transition flex items-center justify-between gap-1 ${
                  activo
                    ? 'border-[#10B981] bg-[#ECFDF5] text-[#065F46]'
                    : 'border-[#EFECE6] bg-white hover:border-[#EE7C6A] text-[#1C1917]'
                }`}
              >
                <span className="truncate">{item.nombre}</span>
                {activo && <Check className="w-3.5 h-3.5 shrink-0 text-[#10B981]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GrabadorVoz;
