import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Download, QrCode, GraduationCap, Copy, Check } from 'lucide-react';
import { Perfil } from '../../types/actividad';
import { obtenerIdEstudiante, obtenerCursoLimpio } from '../../lib/db';

interface ModalCarnetQRProps {
  estudiante: Perfil | null;
  onClose: () => void;
}

export const ModalCarnetQR: React.FC<ModalCarnetQRProps> = ({ estudiante, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copiado, setCopiado] = useState(false);

  const idEst = estudiante ? obtenerIdEstudiante(estudiante) : '';
  const cursoLimpio = estudiante ? obtenerCursoLimpio(estudiante) : '';

  useEffect(() => {
    if (!idEst) return;
    QRCode.toDataURL(idEst, {
      width: 320,
      margin: 2,
      color: {
        dark: '#1C1917',
        light: '#FFFFFF'
      }
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Error generando QR:', err));
  }, [idEst]);

  if (!estudiante) return null;

  const handleDescargarQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `Carnet_QR_${idEst}_${estudiante.nombre.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1C1917]/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans-atelier animate-fadeIn">
      <div className="bg-white rounded-[28px] max-w-sm w-full border border-[#EFECE6] shadow-2xl overflow-hidden">
        {/* Cabecera del Carnet */}
        <div className="bg-[#1C1917] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#EE7C6A] text-white">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#EE7C6A] block">
                Carnet Escolar de Acceso
              </span>
              <h3 className="text-base font-serif-atelier font-bold leading-tight">
                ECO INCLUSIVO ✦
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo del Carnet */}
        <div className="p-6 text-center space-y-4 bg-[#FBF9F5]">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EE7C6A]/15 text-[#EE7C6A] text-xs font-extrabold">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Materia / Curso: {cursoLimpio}</span>
            </div>
            <h4 className="text-xl font-serif-atelier font-bold text-[#1C1917] pt-1">
              {estudiante.nombre}
            </h4>
          </div>

          {/* Código QR */}
          <div className="bg-white p-4 rounded-2xl border-2 border-[#EFECE6] shadow-sm inline-block mx-auto">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR de ${estudiante.nombre}`}
                className="w-48 h-48 mx-auto rounded-lg"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-xs text-[#78716C]">
                Generando QR...
              </div>
            )}
          </div>

          {/* ID para ingreso manual */}
          <div className="p-3 rounded-2xl bg-white border border-[#EFECE6] flex items-center justify-between gap-2">
            <div className="text-left">
              <span className="text-[10px] font-bold uppercase text-[#78716C] block">
                ID de ingreso directo:
              </span>
              <span className="text-base font-mono font-black text-[#1C1917]">
                {idEst}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(idEst);
                setCopiado(true);
                setTimeout(() => setCopiado(false), 2000);
              }}
              className="px-3 py-1.5 rounded-xl bg-[#F5F2EC] hover:bg-[#EBE8E0] text-[#1C1917] text-xs font-bold flex items-center gap-1 transition"
            >
              {copiado ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiado ? 'Copiado' : 'Copiar ID'}</span>
            </button>
          </div>

          <p className="text-[11px] text-[#78716C]">
            El estudiante puede ingresar escaneando este código QR con la cámara o escribiendo únicamente su ID <b>{idEst}</b>.
          </p>

          <div className="pt-1 flex gap-2">
            <button
              type="button"
              onClick={handleDescargarQR}
              className="flex-1 py-3 bg-[#EE7C6A] hover:bg-[#E46653] text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              <Download className="w-4 h-4" />
              <span>Descargar QR (.png)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalCarnetQR;
