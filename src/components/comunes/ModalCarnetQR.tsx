import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Download, Copy, Check, Phone, MapPin, Mail, Globe } from 'lucide-react';
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
      margin: 1,
      color: {
        dark: '#071739',
        light: '#FFFFFF'
      }
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Error generando QR:', err));
  }, [idEst]);

  if (!estudiante) return null;

  const etiquetaDoc = /^\d{7,}$/.test(idEst) ? 'TI / ID' : 'ID';

  const handleDescargarQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `Carnet_EDUPASS_${idEst}_${estudiante.nombre.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#071739]/75 backdrop-blur-sm flex items-center justify-center p-4 font-sans-atelier animate-fadeIn">
      <div className="bg-white rounded-[28px] max-w-sm w-full border-2 border-[#071739] shadow-2xl overflow-hidden">
        {/* Cabecera estilo CARNET EDUPASS — IED CEIS SOPÓ */}
        <div className="bg-[#071739] text-white px-5 pt-4 pb-5 relative overflow-hidden">
          <div className="flex items-start justify-between gap-2 relative z-10">
            <div className="flex items-center gap-3">
              <img
                src="/multimedia/img/logo_ceis.png"
                alt="Escudo IED CEIS Sopó"
                className="w-12 h-12 object-contain bg-white/95 rounded-xl p-1 shadow-md"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#9AC7E8] block">
                  CARNET EDUPASS · ECO INCLUSIVO
                </span>
                <h3 className="text-lg font-extrabold tracking-wide text-white leading-tight">
                  IED CEIS SOPÓ
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition"
              title="Cerrar carnet"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cuerpo del Carnet EDUPASS */}
        <div className="p-5 text-center space-y-3.5 bg-white">
          {/* Datos del estudiante */}
          <div className="space-y-1">
            <h4 className="text-lg font-extrabold text-[#071739] leading-snug">
              {estudiante.nombre}
            </h4>
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#071739]/80">
              GRADO / MATERIA: <span className="text-[#071739]">{cursoLimpio}</span>
            </p>
          </div>

          {/* Barra azul clara institucional EDUPASS con TI / ID */}
          <div className="py-2 px-4 rounded-xl bg-[#9AC7E8] text-[#071739] font-extrabold text-sm tracking-wide shadow-xs flex items-center justify-between">
            <span>
              {etiquetaDoc}: <span className="font-mono font-black">{idEst}</span>
            </span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(idEst);
                setCopiado(true);
                setTimeout(() => setCopiado(false), 2000);
              }}
              className="px-2.5 py-1 rounded-lg bg-white/80 hover:bg-white text-[#071739] text-[11px] font-extrabold flex items-center gap-1 transition"
            >
              {copiado ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiado ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>

          {/* Código QR (codifica el número de documento/ID directo como CARNET EDUPASS) */}
          <div className="bg-white p-3 rounded-2xl border-2 border-[#071739]/15 shadow-sm inline-block mx-auto">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR EDUPASS de ${estudiante.nombre}`}
                className="w-44 h-44 mx-auto"
              />
            ) : (
              <div className="w-44 h-44 flex items-center justify-center text-xs text-[#78716C]">
                Generando QR...
              </div>
            )}
          </div>

          {/* Lema y datos institucionales del reverso EDUPASS */}
          <div className="space-y-2 pt-1">
            <div className="inline-block px-4 py-1 rounded-full bg-[#9AC7E8]/60 text-[#071739] text-[11px] font-black tracking-wider uppercase">
              &ldquo;EDUCAMOS CON EXCELENCIA&rdquo;
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[10px] text-[#071739]/80 font-semibold text-left bg-[#F4F8FC] p-2.5 rounded-xl border border-[#9AC7E8]/40">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-[#071739] shrink-0" />
                <span>3108710141</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-[#071739] shrink-0" />
                <span className="truncate">iedceis@gmail.com</span>
              </div>
              <div className="flex items-center gap-1.5 col-span-2">
                <MapPin className="w-3 h-3 text-[#071739] shrink-0" />
                <span>Cll. 3 Sur #8-98, Sopó Cundi · Estudiante</span>
              </div>
              <div className="flex items-center gap-1.5 col-span-2">
                <Globe className="w-3 h-3 text-[#071739] shrink-0" />
                <span className="truncate">https://iedceis.wixsite.com/2016</span>
              </div>
            </div>
          </div>

          <div className="pt-1 flex gap-2">
            <button
              type="button"
              onClick={handleDescargarQR}
              className="flex-1 py-3 bg-[#071739] hover:bg-[#0D2558] text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              <Download className="w-4 h-4" />
              <span>Descargar QR del Carnet (.png)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalCarnetQR;
