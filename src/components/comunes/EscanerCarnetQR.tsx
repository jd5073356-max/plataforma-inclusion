import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, Upload, X, RefreshCw, QrCode, AlertCircle } from 'lucide-react';
import { normalizarCodigoQR } from '../../lib/db';

interface EscanerCarnetQRProps {
  onDetectado: (codigo: string) => void;
  onCerrar?: () => void;
}

export const EscanerCarnetQR: React.FC<EscanerCarnetQRProps> = ({ onDetectado, onCerrar }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [camaraActiva, setCamaraActiva] = useState(false);
  const [cargandoCamara, setCargandoCamara] = useState(false);
  const [errorCamara, setErrorCamara] = useState('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const detenerStream = () => {
    const vid = videoRef.current;
    if (vid && vid.srcObject) {
      const stream = vid.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      vid.srcObject = null;
    }
    setCamaraActiva(false);
  };

  const iniciarCamara = async (modo: 'environment' | 'user' = facingMode) => {
    setErrorCamara('');
    setCargandoCamara(true);
    detenerStream();

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: modo }, width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCamaraActiva(true);
      }
    } catch {
      setErrorCamara(
        'No se pudo abrir la cámara. Verifica el permiso del navegador o sube una foto/imagen del código QR abajo.'
      );
    } finally {
      setCargandoCamara(false);
    }
  };

  useEffect(() => {
    iniciarCamara(facingMode);
    return () => {
      detenerStream();
    };
  }, []);

  useEffect(() => {
    if (!camaraActiva) return;
    let animId: number;
    let cancelado = false;

    const escanearFrame = () => {
      if (cancelado) return;
      const vid = videoRef.current;
      const canvas = canvasRef.current;
      if (vid && canvas && vid.readyState === vid.HAVE_ENOUGH_DATA) {
        const w = vid.videoWidth;
        const h = vid.videoHeight;
        if (w > 0 && h > 0) {
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(vid, 0, 0, w, h);
            const imgData = ctx.getImageData(0, 0, w, h);
            const code = jsQR(imgData.data, imgData.width, imgData.height, {
              inversionAttempts: 'dontInvert'
            });
            if (code && code.data && code.data.trim()) {
              const limpio = normalizarCodigoQR(code.data);
              if (limpio) {
                cancelado = true;
                detenerStream();
                onDetectado(limpio);
                return;
              }
            }
          }
        }
      }
      animId = requestAnimationFrame(escanearFrame);
    };

    animId = requestAnimationFrame(escanearFrame);
    return () => {
      cancelado = true;
      cancelAnimationFrame(animId);
    };
  }, [camaraActiva]);

  const handleSubirImagenQR = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorCamara('');

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imgData.data, imgData.width, imgData.height, {
        inversionAttempts: 'attemptBoth'
      });
      if (code && code.data && code.data.trim()) {
        const limpio = normalizarCodigoQR(code.data);
        detenerStream();
        onDetectado(limpio);
      } else {
        setErrorCamara('No se detectó un código QR válido en la imagen seleccionada.');
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setErrorCamara('No se pudo procesar la imagen seleccionada.');
    };
    img.src = url;
  };

  return (
    <div className="p-4 rounded-2xl bg-[#1C1917] text-white space-y-3 border-2 border-[#EE7C6A]/50 shadow-lg">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <QrCode className="w-5 h-5 text-[#EE7C6A]" />
          <span className="text-xs font-extrabold uppercase tracking-wider">
            Lector de Carnet QR Estudiantil
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              const nuevo = facingMode === 'environment' ? 'user' : 'environment';
              setFacingMode(nuevo);
              iniciarCamara(nuevo);
            }}
            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold flex items-center gap-1 transition"
            title="Cambiar cámara frontal / trasera"
          >
            <RefreshCw className="w-3 h-3" /> Cambiar cámara
          </button>
          {onCerrar && (
            <button
              type="button"
              onClick={() => {
                detenerStream();
                onCerrar();
              }}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
              title="Cerrar cámara"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Visor de video */}
      <div className="relative w-full aspect-[4/3] max-h-56 bg-black rounded-xl overflow-hidden flex items-center justify-center border border-white/15">
        <video
          ref={videoRef}
          muted
          playsInline
          className={`w-full h-full object-cover ${camaraActiva ? 'block' : 'hidden'}`}
        />
        <canvas ref={canvasRef} className="hidden" />

        {camaraActiva && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-40 h-40 border-2 border-[#EE7C6A] rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] relative">
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-[#EE7C6A] text-white px-2.5 py-0.5 rounded-full whitespace-nowrap">
                Acerca el QR del carnet aquí
              </span>
            </div>
          </div>
        )}

        {!camaraActiva && (
          <div className="text-center p-4 space-y-2">
            <Camera className="w-8 h-8 text-[#EE7C6A] mx-auto opacity-80" />
            <p className="text-xs text-[#A8A29E]">
              {cargandoCamara ? 'Activando cámara para leer el carnet...' : 'Cámara en espera'}
            </p>
          </div>
        )}
      </div>

      {errorCamara && (
        <div className="p-2.5 rounded-xl bg-[#D9363E]/20 border border-[#D9363E]/50 text-[11px] font-semibold text-[#FECACA] flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#EE7C6A]" />
          <span>{errorCamara}</span>
        </div>
      )}

      {/* Opción alternativa: subir imagen del QR */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <label className="w-full py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition border border-white/10">
          <Upload className="w-4 h-4 text-[#EE7C6A]" />
          <span>Subir foto o imagen del código QR</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleSubirImagenQR}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
};

export default EscanerCarnetQR;
