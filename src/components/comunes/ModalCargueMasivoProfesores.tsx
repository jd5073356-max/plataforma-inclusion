import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../lib/db';
import {
  parseProfesoresCSV,
  descargarPlantillaProfesoresCSV,
  ProfesorCSVItem
} from '../../utils/csvParser';
import {
  X, UploadCloud, FileSpreadsheet, Download, CheckCircle2,
  AlertCircle, RefreshCw, FileText, Check, CheckSquare, Square
} from 'lucide-react';

interface ModalCargueMasivoProfesoresProps {
  isOpen: boolean;
  onClose: () => void;
  onCompletado: () => Promise<void> | void;
}

export const ModalCargueMasivoProfesores: React.FC<ModalCargueMasivoProfesoresProps> = ({
  isOpen,
  onClose,
  onCompletado
}) => {
  const [metodo, setMetodo] = useState<'archivo' | 'pegar'>('archivo');
  const [textoPegado, setTextoPegado] = useState('');
  const [nombreArchivo, setNombreArchivo] = useState('');
  const [items, setItems] = useState<ProfesorCSVItem[]>([]);
  const [dragOver, setDragOver] = useState(false);

  // Estado de ejecución
  const [importando, setImportando] = useState(false);
  const [progresoActual, setProgresoActual] = useState(0);
  const [progresoTotal, setProgresoTotal] = useState(0);
  const [profesorActual, setProfesorActual] = useState('');
  const [resultado, setResultado] = useState<{
    creados: number;
    errores: { nombre: string; error: string }[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (metodo === 'pegar' && textoPegado.trim()) {
      const parsed = parseProfesoresCSV(textoPegado);
      setItems(parsed);
    }
  }, [textoPegado, metodo]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !importando) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, importando, onClose]);

  if (!isOpen) return null;

  const handleCargarArchivo = (file: File) => {
    if (!file) return;
    setNombreArchivo(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || '';
      const parsed = parseProfesoresCSV(text);
      setItems(parsed);
      setResultado(null);
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleCargarArchivo(e.dataTransfer.files[0]);
    }
  };

  const toggleSeleccion = (idTemp: string) => {
    setItems(prev =>
      prev.map(it => (it.idTemp === idTemp ? { ...it, seleccionado: !it.seleccionado } : it))
    );
  };

  const toggleSeleccionarTodos = () => {
    const todosSeleccionados = items.every(it => it.seleccionado || !it.valido);
    setItems(prev => prev.map(it => (it.valido ? { ...it, seleccionado: !todosSeleccionados } : it)));
  };

  const itemsSeleccionados = items.filter(it => it.seleccionado && it.valido);
  const itemsInvalidos = items.filter(it => !it.valido);

  const handleEjecutarCargue = async () => {
    if (itemsSeleccionados.length === 0) return;

    try {
      setImportando(true);
      setProgresoActual(0);
      setProgresoTotal(itemsSeleccionados.length);
      setResultado(null);

      const payload = itemsSeleccionados.map(it => ({
        nombre: it.nombre,
        email: it.email,
        contrasena: it.contrasena
      }));

      const res = await db.crearProfesoresMasivo(
        payload,
        (actual, total, itemNombre) => {
          setProgresoActual(actual);
          setProgresoTotal(total);
          setProfesorActual(itemNombre);
        }
      );

      setResultado({
        creados: res.creados,
        errores: res.errores
      });

      await onCompletado();
    } catch (err) {
      console.error('Error durante cargue masivo de profesores:', err);
      alert('Ocurrió un error inesperado al importar profesores.');
    } finally {
      setImportando(false);
    }
  };

  const limpiar = () => {
    setItems([]);
    setNombreArchivo('');
    setTextoPegado('');
    setResultado(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1C1917]/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 font-sans-atelier animate-fadeIn">
      <div className="bg-white rounded-[28px] max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#EFECE6] overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#EFECE6] flex items-center justify-between bg-[#FBF9F5] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-[#7294B9] text-white p-2.5 rounded-2xl shadow-sm shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7294B9] bg-[#7294B9]/10 px-2.5 py-0.5 rounded-full">
                  Administración Masiva
                </span>
                <span className="text-xs font-bold text-[#78716C]">
                  Formato CSV o Excel
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-serif-atelier font-bold text-[#1C1917] truncate">
                Cargue Masivo de Profesores
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => descargarPlantillaProfesoresCSV()}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#EFECE6] text-xs font-bold text-[#57534E] hover:text-[#7294B9] hover:bg-[#F5F2EC] transition shadow-xs"
              title="Descargar plantilla de ejemplo para profesores"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Plantilla Profesores CSV</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={importando}
              className="p-2 text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F2EC] rounded-full transition disabled:opacity-40"
              title="Cerrar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {resultado ? (
            <div className="space-y-6 py-4">
              <div className="p-6 bg-[#ECFDF5] border border-[#A7F3D0] rounded-[24px] text-center space-y-3">
                <div className="w-14 h-14 bg-[#10B981] text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-serif-atelier font-bold text-[#065F46]">
                  ¡Profesores importados con éxito!
                </h3>
                <p className="text-sm font-semibold text-[#047857]">
                  Se registraron <span className="font-black text-lg">{resultado.creados}</span> docentes en la institución.
                </p>

                {resultado.errores.length > 0 && (
                  <div className="mt-4 p-4 bg-white/80 rounded-2xl border border-[#FFCCC7] text-left text-xs space-y-1">
                    <span className="font-bold text-[#D9363E] block">
                      ⚠️ {resultado.errores.length} fila(s) tuvieron inconvenientes:
                    </span>
                    <ul className="list-disc pl-5 text-[#78716C] space-y-0.5">
                      {resultado.errores.map((err, i) => (
                        <li key={i}>
                          <b>{err.nombre}:</b> {err.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={limpiar}
                  className="px-5 py-2.5 bg-white border border-[#EFECE6] hover:bg-[#F5F2EC] text-[#57534E] text-xs font-bold rounded-full transition shadow-xs"
                >
                  Subir otro archivo
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-[#7294B9] hover:bg-[#5C7D9E] text-white text-xs font-bold rounded-full transition shadow-sm"
                >
                  Finalizar y Ver Profesores
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Selector de Entrada */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="bg-[#F5F2EC] p-1 rounded-full flex items-center gap-1 border border-[#EFECE6] self-start">
                  <button
                    type="button"
                    onClick={() => setMetodo('archivo')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                      metodo === 'archivo'
                        ? 'bg-white text-[#1C1917] shadow-sm'
                        : 'text-[#78716C] hover:text-[#1C1917]'
                    }`}
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Subir archivo .CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetodo('pegar')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                      metodo === 'pegar'
                        ? 'bg-white text-[#1C1917] shadow-sm'
                        : 'text-[#78716C] hover:text-[#1C1917]'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Pegar texto</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => descargarPlantillaProfesoresCSV()}
                  className="sm:hidden flex items-center gap-1.5 text-xs font-bold text-[#7294B9] hover:underline"
                >
                  <Download className="w-3.5 h-3.5" /> Descargar Plantilla CSV
                </button>
              </div>

              {metodo === 'archivo' ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-[24px] p-8 text-center transition-all cursor-pointer ${
                    dragOver
                      ? 'border-[#7294B9] bg-[#F4F7FA] scale-[1.01]'
                      : 'border-[#EFECE6] bg-[#FBF9F5] hover:bg-white hover:border-[#7294B9]/60'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv,text/plain"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleCargarArchivo(e.target.files[0]);
                      }
                    }}
                  />

                  <div className="w-14 h-14 rounded-2xl bg-[#7294B9]/10 text-[#7294B9] flex items-center justify-center mx-auto mb-3">
                    <UploadCloud className="w-7 h-7" />
                  </div>

                  {nombreArchivo ? (
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-[#1C1917]">
                        Archivo seleccionado: <span className="text-[#7294B9]">{nombreArchivo}</span>
                      </p>
                      <p className="text-xs text-[#78716C]">
                        Toca aquí si deseas cambiar el archivo.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-[#1C1917]">
                        Arrastra y suelta tu archivo CSV aquí, o <span className="text-[#7294B9] underline">explora tu equipo</span>
                      </p>
                      <p className="text-xs text-[#78716C]">
                        Formato esperado: <b>Nombre Completo, Correo Institucional, Contraseña</b>
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#78716C] uppercase">
                    Pega las líneas directamente desde Excel:
                  </label>
                  <textarea
                    rows={5}
                    value={textoPegado}
                    onChange={(e) => setTextoPegado(e.target.value)}
                    placeholder="Rafael Suárez, rafael@institucion.edu.co, Clave2026*&#10;Claudia Méndez, claudia@institucion.edu.co, Clave2026*"
                    className="w-full p-3.5 border border-[#EFECE6] rounded-2xl text-xs font-mono bg-[#FBF9F5] text-[#1C1917] focus:outline-none focus:border-[#7294B9]"
                  />
                </div>
              )}

              {importando && (
                <div className="p-5 bg-white border border-[#7294B9]/30 rounded-2xl shadow-sm space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[#1C1917] flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-[#7294B9] animate-spin" />
                      Registrando profesor: <span className="text-[#7294B9]">{profesorActual}</span>
                    </span>
                    <span className="text-[#78716C]">
                      {progresoActual} de {progresoTotal}
                    </span>
                  </div>

                  <div className="h-3 bg-[#F5F2EC] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#7294B9] transition-all duration-300 rounded-full"
                      style={{ width: `${progresoTotal > 0 ? (progresoActual / progresoTotal) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              )}

              {items.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <h4 className="text-base font-serif-atelier font-bold text-[#1C1917]">
                        Vista previa ({items.length} filas detectadas)
                      </h4>
                      <button
                        type="button"
                        onClick={toggleSeleccionarTodos}
                        className="text-xs font-bold text-[#7294B9] hover:underline"
                      >
                        {items.every(it => it.seleccionado || !it.valido) ? 'Desmarcar todos' : 'Marcar todos'}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                        ✓ {itemsSeleccionados.length} listos
                      </span>
                      {itemsInvalidos.length > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#FFF2F0] text-[#D9363E] border border-[#FFCCC7]">
                          ✕ {itemsInvalidos.length} con error
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="border border-[#EFECE6] rounded-2xl overflow-hidden bg-white shadow-xs">
                    <div className="max-h-72 overflow-y-auto overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-[#FBF9F5] border-b border-[#EFECE6] sticky top-0 z-10 text-[#78716C] font-bold uppercase text-[10px] tracking-wider">
                          <tr>
                            <th className="p-3 w-10 text-center">Sel.</th>
                            <th className="p-3 w-12 text-center">#</th>
                            <th className="p-3">Nombre Completo</th>
                            <th className="p-3">Correo Electrónico</th>
                            <th className="p-3">Contraseña</th>
                            <th className="p-3">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EFECE6]">
                          {items.map((it, idx) => (
                            <tr
                              key={it.idTemp}
                              className={`hover:bg-[#FBF9F5] transition ${
                                !it.valido
                                  ? 'bg-[#FFF2F0]/30'
                                  : it.seleccionado
                                  ? 'bg-white'
                                  : 'bg-white opacity-60'
                              }`}
                            >
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  disabled={!it.valido}
                                  onClick={() => toggleSeleccion(it.idTemp)}
                                  className="text-[#7294B9] disabled:opacity-30"
                                >
                                  {it.seleccionado && it.valido ? (
                                    <CheckSquare className="w-4 h-4 fill-[#7294B9] text-white" />
                                  ) : (
                                    <Square className="w-4 h-4 text-[#A8A29E]" />
                                  )}
                                </button>
                              </td>
                              <td className="p-3 text-center font-bold text-[#A8A29E]">
                                {idx + 1}
                              </td>
                              <td className="p-3 font-bold text-[#1C1917]">
                                {it.nombre}
                              </td>
                              <td className="p-3 font-mono text-[11px] text-[#57534E]">
                                {it.email}
                              </td>
                              <td className="p-3 font-mono text-[11px] text-[#78716C]">
                                {it.contrasena ? '••••••••' : '-'}
                              </td>
                              <td className="p-3">
                                {it.valido ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#10B981]">
                                    <Check className="w-3.5 h-3.5" /> Listo
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D9363E]">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {it.error}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!resultado && (
          <div className="p-4 sm:p-5 border-t border-[#EFECE6] bg-[#FBF9F5] flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={importando}
              className="px-5 py-2.5 rounded-full border border-[#EFECE6] bg-white text-[#57534E] hover:bg-[#F5F2EC] text-xs font-bold transition disabled:opacity-40"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleEjecutarCargue}
              disabled={importando || itemsSeleccionados.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#7294B9] hover:bg-[#5C7D9E] text-white text-xs font-bold transition shadow-sm disabled:opacity-40"
            >
              {importando ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Importando...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>
                    Importar {itemsSeleccionados.length > 0 ? `${itemsSeleccionados.length} Profesor(es)` : 'Profesores'}
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModalCargueMasivoProfesores;
