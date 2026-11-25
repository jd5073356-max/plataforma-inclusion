import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../lib/db';
import { Etapa } from '../../types/actividad';
import {
  parseEstudiantesCSV,
  parseEstudiantesFilas,
  extraerFilasDesdeArchivo,
  descargarPlantillaEstudiantesExcel,
  descargarPlantillaEstudiantesCSV,
  EstudianteCSVItem
} from '../../utils/csvParser';
import {
  X, UploadCloud, FileSpreadsheet, Download, CheckCircle2,
  AlertCircle, RefreshCw, FileText, Check, ArrowRight,
  Sparkles, CheckSquare, Square, Trash2, Filter
} from 'lucide-react';

interface ModalCargueMasivoEstudiantesProps {
  isOpen: boolean;
  onClose: () => void;
  profesorId: string;
  etapas: Etapa[];
  onCompletado: () => Promise<void> | void;
}

export const ModalCargueMasivoEstudiantes: React.FC<ModalCargueMasivoEstudiantesProps> = ({
  isOpen,
  onClose,
  profesorId,
  etapas,
  onCompletado
}) => {
  const [metodo, setMetodo] = useState<'archivo' | 'pegar'>('archivo');
  const [textoPegado, setTextoPegado] = useState('');
  const [filasArchivo, setFilasArchivo] = useState<string[][]>([]);
  const [nombreArchivo, setNombreArchivo] = useState('');
  const [errorArchivo, setErrorArchivo] = useState('');
  const [items, setItems] = useState<EstudianteCSVItem[]>([]);
  const [dragOver, setDragOver] = useState(false);

  // Opciones globales por defecto
  const [cursoDefecto, setCursoDefecto] = useState('');
  const [ajusteDefecto, setAjusteDefecto] = useState<'cognitiva' | 'motriz' | 'tea' | ''>('');
  const [rutaDefectoId, setRutaDefectoId] = useState('');

  // Estado de ejecución
  const [importando, setImportando] = useState(false);
  const [progresoActual, setProgresoActual] = useState(0);
  const [progresoTotal, setProgresoTotal] = useState(0);
  const [estudianteActual, setEstudianteActual] = useState('');
  const [resultado, setResultado] = useState<{
    creados: number;
    errores: { nombre: string; error: string }[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Re-procesar cuando cambian los defaults, las filas de archivo o el texto pegado
  useEffect(() => {
    const opts = {
      curso: cursoDefecto || undefined,
      ajuste: ajusteDefecto || undefined,
      rutaId: rutaDefectoId || undefined
    };
    if (metodo === 'pegar' && textoPegado.trim()) {
      setItems(parseEstudiantesCSV(textoPegado, etapas, opts));
    } else if (metodo === 'archivo' && filasArchivo.length > 0) {
      setItems(parseEstudiantesFilas(filasArchivo, etapas, opts));
    }
  }, [textoPegado, filasArchivo, cursoDefecto, ajusteDefecto, rutaDefectoId, metodo, etapas]);

  // Cerrar con Escape
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

  const handleCargarArchivo = async (file: File) => {
    if (!file) return;
    setNombreArchivo(file.name);
    setErrorArchivo('');
    try {
      const filas = await extraerFilasDesdeArchivo(file);
      setFilasArchivo(filas);
      setResultado(null);
    } catch (err) {
      setErrorArchivo(err instanceof Error ? err.message : 'No se pudo leer el archivo seleccionado.');
      setFilasArchivo([]);
      setItems([]);
    }
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
        curso: it.curso,
        ajuste: it.ajuste,
        rutasIds: it.rutasIds
      }));

      const res = await db.crearEstudiantesMasivo(
        payload,
        profesorId,
        (actual, total, itemNombre) => {
          setProgresoActual(actual);
          setProgresoTotal(total);
          setEstudianteActual(itemNombre);
        }
      );

      setResultado({
        creados: res.creados,
        errores: res.errores
      });

      await onCompletado();
    } catch (err) {
      console.error('Error durante cargue masivo:', err);
      alert('Ocurrió un error inesperado durante la importación masiva.');
    } finally {
      setImportando(false);
    }
  };

  const limpiar = () => {
    setItems([]);
    setFilasArchivo([]);
    setNombreArchivo('');
    setErrorArchivo('');
    setTextoPegado('');
    setResultado(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1C1917]/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 font-sans-atelier animate-fadeIn">
      <div className="bg-white rounded-[28px] max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#EFECE6] overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#EFECE6] flex items-center justify-between bg-[#FBF9F5] shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-[#EE7C6A] text-white p-2.5 rounded-2xl shadow-sm shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#EE7C6A] bg-[#EE7C6A]/10 px-2.5 py-0.5 rounded-full">
                  Herramienta Masiva
                </span>
                <span className="text-xs font-bold text-[#78716C]">
                  Excel (.xlsx) o CSV
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-serif-atelier font-bold text-[#1C1917] truncate">
                Cargue Masivo de Estudiantes
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => descargarPlantillaEstudiantesExcel()}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#10B981] hover:bg-[#0EA371] text-white text-xs font-bold transition shadow-xs"
              title="Descargar archivo de Excel con columnas separadas listo para llenar"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar Plantilla Excel (.xlsx)</span>
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
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Si ya terminó la importación con éxito */}
          {resultado ? (
            <div className="space-y-6 py-4">
              <div className="p-6 bg-[#ECFDF5] border border-[#A7F3D0] rounded-[24px] text-center space-y-3">
                <div className="w-14 h-14 bg-[#10B981] text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-serif-atelier font-bold text-[#065F46]">
                  ¡Cargue masivo completado con éxito!
                </h3>
                <p className="text-sm font-semibold text-[#047857]">
                  Se registraron <span className="font-black text-lg">{resultado.creados}</span> estudiantes en el sistema.
                  Ya pueden ingresar a la plataforma con su nombre y curso.
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
                  className="px-6 py-2.5 bg-[#EE7C6A] hover:bg-[#E46653] text-white text-xs font-bold rounded-full transition shadow-sm"
                >
                  Finalizar y Ver Estudiantes
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Guía visual rápida de cómo llenar el Excel */}
              {items.length === 0 && (
                <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#EFECE6] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-extrabold text-[#1C1917]">
                      📋 ¿Cómo usar el cargue masivo en 3 pasos sencillos?
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => descargarPlantillaEstudiantesExcel()}
                        className="text-xs font-extrabold text-[#10B981] hover:underline flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" /> Plantilla Excel (.xlsx)
                      </button>
                      <button
                        type="button"
                        onClick={() => descargarPlantillaEstudiantesCSV()}
                        className="text-[11px] font-bold text-[#78716C] hover:underline"
                      >
                        Formato .CSV
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-[#57534E]">
                    <b>1.</b> Descarga la plantilla de Excel · <b>2.</b> Escribe el <b>Nombre</b> y el <b>Curso</b> de cada estudiante en sus columnas · <b>3.</b> Guarda y sube el mismo archivo Excel aquí:
                  </p>
                  <div className="overflow-x-auto rounded-xl border border-[#EFECE6] bg-white">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-[#EE7C6A] text-white font-bold">
                          <th className="py-1.5 px-3 border-r border-white/20">Columna A: Nombre del Estudiante</th>
                          <th className="py-1.5 px-3 border-r border-white/20">Columna B: Curso</th>
                          <th className="py-1.5 px-3">Columna C: Apoyo (Opcional)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EFECE6] text-[#44403C]">
                        <tr>
                          <td className="py-1.5 px-3 border-r border-[#EFECE6] font-semibold">María Paula Peñuela</td>
                          <td className="py-1.5 px-3 border-r border-[#EFECE6]">901</td>
                          <td className="py-1.5 px-3 text-[#78716C]">motriz</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-3 border-r border-[#EFECE6] font-semibold">Laura Sofía Ramírez</td>
                          <td className="py-1.5 px-3 border-r border-[#EFECE6]">901</td>
                          <td className="py-1.5 px-3 text-[#A8A29E] italic">(puede quedar vacío)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Selector de Entrada: Archivo o Pegar Texto */}
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
                    <span>Subir Excel (.xlsx) o CSV</span>
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
                    <span>Copiar y pegar desde Excel</span>
                  </button>
                </div>
              </div>

              {errorArchivo && (
                <div className="p-3 rounded-xl bg-[#FFF2F0] border border-[#FFCCC7] text-xs font-bold text-[#D9363E]">
                  {errorArchivo}
                </div>
              )}

              {/* Zona de Drop o Textarea */}
              {metodo === 'archivo' ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-[24px] p-7 text-center transition-all cursor-pointer ${
                    dragOver
                      ? 'border-[#EE7C6A] bg-[#FFF8F7] scale-[1.01]'
                      : 'border-[#EFECE6] bg-[#FBF9F5] hover:bg-white hover:border-[#EE7C6A]/60'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.csv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/plain"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleCargarArchivo(e.target.files[0]);
                      }
                    }}
                  />

                  <div className="w-12 h-12 rounded-2xl bg-[#EE7C6A]/10 text-[#EE7C6A] flex items-center justify-center mx-auto mb-2.5">
                    <UploadCloud className="w-6 h-6" />
                  </div>

                  {nombreArchivo ? (
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-[#1C1917]">
                        Archivo cargado: <span className="text-[#EE7C6A]">{nombreArchivo}</span>
                      </p>
                      <p className="text-xs text-[#78716C]">
                        Haz clic aquí si deseas seleccionar otro archivo.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-[#1C1917]">
                        Suelta aquí tu archivo de <span className="text-[#10B981]">Excel (.xlsx)</span> o CSV, o <span className="text-[#EE7C6A] underline">explora tu equipo</span>
                      </p>
                      <p className="text-xs text-[#78716C]">
                        Acepta archivos guardados directamente desde Excel (.xlsx) o archivos .csv.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#78716C] uppercase">
                    Selecciona las celdas en tu hoja de Excel (Ctrl+C) y pégalas aquí (Ctrl+V):
                  </label>
                  <textarea
                    rows={5}
                    value={textoPegado}
                    onChange={(e) => setTextoPegado(e.target.value)}
                    placeholder={"María Paula Peñuela\t901\tmotriz\nCarlos Eduardo Gómez\t802\tcognitiva\nLaura Sofía Ramírez\t901"}
                    className="w-full p-3.5 border border-[#EFECE6] rounded-2xl text-xs font-mono bg-[#FBF9F5] text-[#1C1917] focus:outline-none focus:border-[#EE7C6A]"
                  />
                  <p className="text-[11px] text-[#78716C]">
                    Puedes copiar directamente las columnas <b>Nombre</b> y <b>Curso</b> desde Excel o Google Sheets y pegarlas aquí.
                  </p>
                </div>
              )}

              {/* Opciones globales por defecto (Ruta, Ajuste, Curso) */}
              <div className="p-4 bg-[#F5F2EC]/60 border border-[#EFECE6] rounded-2xl space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#78716C] block">
                  ⚙️ Valores por defecto para el lote (opcional):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#57534E] mb-1">
                      Curso por defecto:
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: 901"
                      value={cursoDefecto}
                      onChange={(e) => setCursoDefecto(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-[#EFECE6] rounded-xl text-xs font-medium text-[#1C1917] focus:outline-none focus:border-[#EE7C6A]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#57534E] mb-1">
                      Ajuste de Accesibilidad:
                    </label>
                    <select
                      value={ajusteDefecto}
                      onChange={(e) => setAjusteDefecto(e.target.value as any)}
                      className="w-full px-3 py-1.5 bg-white border border-[#EFECE6] rounded-xl text-xs font-medium text-[#1C1917] focus:outline-none focus:border-[#EE7C6A]"
                    >
                      <option value="">Sin ajuste predeterminado</option>
                      <option value="motriz">Motriz (Tablet asistida)</option>
                      <option value="cognitiva">Cognitiva (TTS y pictogramas)</option>
                      <option value="tea">TEA (Sin animaciones)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#57534E] mb-1">
                      Asignar a todos esta ruta:
                    </label>
                    <select
                      value={rutaDefectoId}
                      onChange={(e) => setRutaDefectoId(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-[#EFECE6] rounded-xl text-xs font-medium text-[#1C1917] focus:outline-none focus:border-[#EE7C6A]"
                    >
                      <option value="">Ninguna ruta predeterminada</option>
                      {etapas.map(et => (
                        <option key={et.id} value={et.id}>{et.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Barra de progreso si está importando */}
              {importando && (
                <div className="p-5 bg-white border border-[#EE7C6A]/30 rounded-2xl shadow-sm space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[#1C1917] flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-[#EE7C6A] animate-spin" />
                      Registrando estudiante: <span className="text-[#EE7C6A]">{estudianteActual}</span>
                    </span>
                    <span className="text-[#78716C]">
                      {progresoActual} de {progresoTotal} ({progresoTotal > 0 ? Math.round((progresoActual / progresoTotal) * 100) : 0}%)
                    </span>
                  </div>

                  <div className="h-3 bg-[#F5F2EC] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#EE7C6A] transition-all duration-300 rounded-full"
                      style={{ width: `${progresoTotal > 0 ? (progresoActual / progresoTotal) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Previsualización de Datos */}
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
                        className="text-xs font-bold text-[#EE7C6A] hover:underline"
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

                  {/* Tabla con scroll horizontal y vertical */}
                  <div className="border border-[#EFECE6] rounded-2xl overflow-hidden bg-white shadow-xs">
                    <div className="max-h-72 overflow-y-auto overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-[#FBF9F5] border-b border-[#EFECE6] sticky top-0 z-10 text-[#78716C] font-bold uppercase text-[10px] tracking-wider">
                          <tr>
                            <th className="p-3 w-10 text-center">Sel.</th>
                            <th className="p-3 w-12 text-center">#</th>
                            <th className="p-3">Nombre Completo</th>
                            <th className="p-3">Curso</th>
                            <th className="p-3">Email Interno</th>
                            <th className="p-3">Ajuste</th>
                            <th className="p-3">Ruta</th>
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
                                  className="text-[#EE7C6A] disabled:opacity-30"
                                >
                                  {it.seleccionado && it.valido ? (
                                    <CheckSquare className="w-4 h-4 fill-[#EE7C6A] text-white" />
                                  ) : (
                                    <Square className="w-4 h-4 text-[#A8A29E]" />
                                  )}
                                </button>
                              </td>
                              <td className="p-3 text-center font-bold text-[#A8A29E]">
                                {idx + 1}
                              </td>
                              <td className="p-3 font-bold text-[#1C1917]">
                                {it.nombre || <span className="text-[#D9363E] italic">Vacío</span>}
                              </td>
                              <td className="p-3 font-semibold text-[#57534E]">
                                {it.curso ? (
                                  <span className="px-2 py-0.5 bg-[#F5F2EC] rounded-md font-bold">
                                    {it.curso}
                                  </span>
                                ) : (
                                  <span className="text-[#D9363E] italic">Sin curso</span>
                                )}
                              </td>
                              <td className="p-3 font-mono text-[11px] text-[#78716C]">
                                {it.emailCalculado || '-'}
                              </td>
                              <td className="p-3">
                                {it.ajuste ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#EE7C6A]/10 text-[#EE7C6A]">
                                    {it.ajuste}
                                  </span>
                                ) : (
                                  <span className="text-[#A8A29E]">-</span>
                                )}
                              </td>
                              <td className="p-3">
                                {it.rutasNombres && it.rutasNombres.length > 0 ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#7294B9]/10 text-[#7294B9] truncate max-w-[130px] inline-block">
                                    {it.rutasNombres.join(', ')}
                                  </span>
                                ) : (
                                  <span className="text-[#A8A29E]">-</span>
                                )}
                              </td>
                              <td className="p-3">
                                {it.valido ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#10B981]">
                                    <Check className="w-3.5 h-3.5" /> Listo
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D9363E]" title={it.error}>
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
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#EE7C6A] hover:bg-[#E46653] text-white text-xs font-bold transition shadow-sm disabled:opacity-40"
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
                    Importar {itemsSeleccionados.length > 0 ? `${itemsSeleccionados.length} Estudiante(s)` : 'Estudiantes'}
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

export default ModalCargueMasivoEstudiantes;
