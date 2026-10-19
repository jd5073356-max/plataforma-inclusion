import React, { useState } from 'react';
import { Upload, Image as ImageIcon, Link, Grid, Trash2, Check } from 'lucide-react';

const IMAGENES_BIBLIOTECA = [
  { nombre: '🧠 Cerebro', url: '/multimedia/img/cerebro.jpg' },
  { nombre: '👁️ Ojo', url: '/multimedia/img/ojo.jpg' },
  { nombre: '👂 Oreja', url: '/multimedia/img/oreja.jpg' },
  { nombre: '🖐️ Piel', url: '/multimedia/img/piel.jpg' },
  { nombre: '🐻‍❄️ Oso polar', url: '/multimedia/img/oso_polar.jpg' },
  { nombre: '🐧 Pingüino', url: '/multimedia/img/pinguino.jpg' },
  { nombre: '🐪 Camello', url: '/multimedia/img/camello.jpg' },
  { nombre: '🦁 León', url: '/multimedia/img/leon.jpg' },
  { nombre: '🐄 Vaca Sopó', url: '/multimedia/img/vaca_sopo.jpg' },
  { nombre: '❄️ Polo', url: '/multimedia/img/paisaje_polo.jpg' },
  { nombre: '🏜️ Desierto', url: '/multimedia/img/paisaje_desierto.jpg' },
  { nombre: '😃 Alegría', url: '/multimedia/img/emocion_alegria.jpg' },
  { nombre: '😌 Calma', url: '/multimedia/img/emocion_calma.jpg' },
  { nombre: '🔦 Linterna', url: '/multimedia/img/linterna.jpg' },
  { nombre: '🎸 Guitarra', url: '/multimedia/img/guitarra.jpg' },
  { nombre: '🧊 Hielo', url: '/multimedia/img/hielo.jpg' }
];

interface SubeImagenProps {
  onImageSelected: (urlOrFile: string | File) => Promise<void> | void;
  previewUrl?: string;
  label?: string;
}

export const SubeImagen: React.FC<SubeImagenProps> = ({
  onImageSelected,
  previewUrl,
  label = '🖼️ Imagen de soporte (Opcional)'
}) => {
  const [tab, setTab] = useState<'upload' | 'biblioteca' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState(previewUrl || '');
  const [subiendo, setSubiendo] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        setSubiendo(true);
        await onImageSelected(e.target.files[0]);
      } finally {
        setSubiendo(false);
      }
    }
  };

  const handleUrlApply = () => {
    if (urlInput.trim()) {
      onImageSelected(urlInput.trim());
    }
  };

  return (
    <div className="p-4 border-2 border-[#EFECE6] rounded-2xl bg-[#FBF9F5] space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold text-[#1C1917] uppercase tracking-wider flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-[#7294B9]" /> {label}
        </span>

        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#EFECE6]">
          <button
            type="button"
            onClick={() => setTab('upload')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
              tab === 'upload' ? 'bg-[#7294B9] text-white' : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            <Upload className="w-3 h-3" /> Subir archivo
          </button>
          <button
            type="button"
            onClick={() => setTab('biblioteca')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
              tab === 'biblioteca' ? 'bg-[#7294B9] text-white' : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            <Grid className="w-3 h-3" /> Galería escolar
          </button>
          <button
            type="button"
            onClick={() => setTab('url')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
              tab === 'url' ? 'bg-[#7294B9] text-white' : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            <Link className="w-3 h-3" /> URL
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div className="md:col-span-2">
          {tab === 'upload' && (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#D6D3CD] rounded-xl p-4 cursor-pointer hover:border-[#7294B9] bg-white transition text-center">
              <Upload className="w-6 h-6 text-[#7294B9] mb-1" />
              <span className="text-xs font-bold text-[#1C1917]">
                {subiendo ? 'Subiendo imagen...' : 'Seleccionar foto o pictograma desde tu equipo'}
              </span>
              <span className="text-[11px] text-[#78716C] mt-0.5">PNG, JPG, WEBP o GIF</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={subiendo}
                className="hidden"
              />
            </label>
          )}

          {tab === 'biblioteca' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 max-h-40 overflow-y-auto p-1">
              {IMAGENES_BIBLIOTECA.map((img) => {
                const activa = previewUrl === img.url;
                return (
                  <button
                    key={img.url}
                    type="button"
                    onClick={() => onImageSelected(img.url)}
                    className={`p-1.5 rounded-xl border text-left text-[11px] font-bold transition flex items-center gap-1.5 ${
                      activa
                        ? 'border-[#10B981] bg-[#ECFDF5] text-[#065F46]'
                        : 'border-[#EFECE6] bg-white hover:border-[#7294B9] text-[#1C1917]'
                    }`}
                  >
                    <img src={img.url} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0" />
                    <span className="truncate flex-1">{img.nombre}</span>
                    {activa && <Check className="w-3 h-3 text-[#10B981] shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {tab === 'url' && (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://ejemplo.com/imagen.jpg o /multimedia/img/..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 px-3 py-2 border border-[#EFECE6] rounded-xl text-xs bg-white text-[#1C1917]"
              />
              <button
                type="button"
                onClick={handleUrlApply}
                className="px-4 py-2 bg-[#7294B9] hover:bg-[#5C7D9E] text-white text-xs font-bold rounded-xl transition"
              >
                Usar URL
              </button>
            </div>
          )}
        </div>

        {/* Vista previa */}
        <div className="flex flex-col items-center justify-center p-2.5 border border-[#EFECE6] rounded-xl bg-white min-h-[96px]">
          {previewUrl ? (
            <div className="flex items-center gap-3">
              <img
                src={previewUrl}
                alt="Vista previa"
                className="h-16 w-16 rounded-lg object-cover border border-[#EFECE6]"
              />
              <button
                type="button"
                onClick={() => onImageSelected('')}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-[#D9363E] hover:bg-[#FFF2F0] rounded-lg transition"
              >
                <Trash2 className="w-3.5 h-3.5" /> Quitar
              </button>
            </div>
          ) : (
            <div className="text-center text-[#A8A29E]">
              <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-50" />
              <span className="text-[11px] font-semibold">Sin imagen</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubeImagen;
