import React, { useState, useEffect } from 'react';
import { Mic, Square, Play, RotateCcw, Check } from 'lucide-react';
import { useGrabadora } from '../../hooks/useGrabadora';

interface GrabadorVozProps {
  onSave: (blob: Blob) => void;
  label?: string;
}

export const GrabadorVoz: React.FC<GrabadorVozProps> = ({ onSave, label = 'Grabar instrucción de voz' }) => {
  const { recording, audioUrl, audioBlob, startRecording, stopRecording, resetRecording } = useGrabadora();
  const [seconds, setSeconds] = useState(0);

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

  const handleSave = () => {
    if (audioBlob) {
      onSave(audioBlob);
    }
  };

  return (
    <div className="p-4 border rounded-xl bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
      <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{label}</span>
      
      <div className="flex flex-wrap items-center gap-3">
        {!recording && !audioUrl && (
          <button
            type="button"
            onClick={startRecording}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition shadow-md"
          >
            <Mic className="w-5 h-5 animate-pulse" />
            Iniciar Grabación
          </button>
        )}

        {recording && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-medium transition animate-pulse"
            >
              <Square className="w-5 h-5 text-red-500 fill-current" />
              Detener ({formatTime(seconds)})
            </button>
            <span className="w-3 h-3 rounded-full bg-red-600 animate-ping"></span>
          </div>
        )}

        {audioUrl && (
          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center gap-2">
              <audio src={audioUrl} controls className="h-10 w-full max-w-md" />
              <button
                type="button"
                onClick={resetRecording}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition"
                title="Volver a grabar"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
            
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition shadow-md w-fit mt-1"
            >
              <Check className="w-5 h-5" />
              Confirmar y Usar Audio
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GrabadorVoz;
