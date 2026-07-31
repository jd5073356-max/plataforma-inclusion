import React, { useState } from 'react';
import { Upload, Image as ImageIcon, Link } from 'lucide-react';

interface SubeImagenProps {
  onImageSelected: (urlOrFile: string | File) => void;
  previewUrl?: string;
  label?: string;
}

export const SubeImagen: React.FC<SubeImagenProps> = ({
  onImageSelected,
  previewUrl,
  label = 'Imagen complementaria'
}) => {
  const [tab, setTab] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onImageSelected(file);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onImageSelected(urlInput.trim());
    }
  };

  return (
    <div className="p-4 border rounded-xl bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
      <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{label}</span>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
        <button
          type="button"
          onClick={() => setTab('upload')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition -mb-px ${
            tab === 'upload'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Upload className="w-4 h-4" />
          Subir archivo
        </button>
        <button
          type="button"
          onClick={() => setTab('url')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition -mb-px ${
            tab === 'url'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Link className="w-4 h-4" />
          Pegar enlace URL
        </button>
      </div>

      {/* Main Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div>
          {tab === 'upload' ? (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition text-center">
              <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Seleccionar imagen o soltar aquí</span>
              <span className="text-xs text-gray-400 mt-1">PNG, JPG o GIF</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          ) : (
            <form onSubmit={handleUrlSubmit} className="flex gap-2">
              <input
                type="url"
                placeholder="https://ejemplo.com/imagen.png"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
              >
                Cargar
              </button>
            </form>
          )}
        </div>

        {/* Preview */}
        <div className="flex flex-col items-center justify-center p-3 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700 min-h-[120px]">
          {previewUrl ? (
            <div className="relative group max-w-full">
              <img
                src={previewUrl}
                alt="Vista previa"
                className="max-h-28 rounded shadow object-contain"
              />
              <span className="absolute bottom-1 right-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                Vista previa
              </span>
            </div>
          ) : (
            <div className="text-center text-gray-400 dark:text-gray-500">
              <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-60" />
              <span className="text-xs">Sin imagen seleccionada</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubeImagen;
