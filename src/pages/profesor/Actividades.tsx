import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/db';
import { Actividad, ActividadTipo, Etapa, PreguntaConfig } from '../../types/actividad';
import { 
  PlusCircle, 
  Trash2, 
  FileEdit, 
  Layers, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Volume2, 
  Image as ImageIcon, 
  ArrowRight,
  RefreshCw,
  FolderPlus,
  Play,
  Check,
  Award
} from 'lucide-react';

export default function Actividades() {
  const { profile } = useAuth();
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ error: '', success: '' });

  // Creation/Editing Form State
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [titulo, setTitulo] = useState('');
  const [etapaId, setEtapaId] = useState('');
  const [tipo, setTipo] = useState<ActividadTipo>('seleccion');
  const [mostrarFelicitacion, setMostrarFelicitacion] = useState(true);
  const [vozSintetica, setVozSintetica] = useState(true);

  // Question Creator State (Supports single question for simplicity & elegance, or multiple)
  const [instruccion, setInstruccion] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');

  // Type-specific inputs
  // 1. Selección
  const [opcionesSeleccion, setOpcionesSeleccion] = useState([
    { texto: '', esCorrecta: true },
    { texto: '', esCorrecta: false },
    { texto: '', esCorrecta: false }
  ]);

  // 2. Emparejar
  const [parejasEmparejar, setParejasEmparejar] = useState([
    { origen: '', destino: '' },
    { origen: '', destino: '' }
  ]);

  // 3. Clasificar
  const [categoriasClasificar, setCategoriasClasificar] = useState(['', '']);
  const [elementosClasificar, setElementosClasificar] = useState([
    { texto: '', categoriaIndex: 0 },
    { texto: '', categoriaIndex: 1 }
  ]);

  // 4. Completar
  const [oracionCompletar, setOracionCompletar] = useState('');
  const [opcionesCompletar, setOpcionesCompletar] = useState(['', '', '']);

  // 5. Reconocer Emociones
  const [rostroUrl, setRostroUrl] = useState('https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300');
  const [emocionCorrecta, setEmocionCorrecta] = useState('alegría');
  const [opcionesEmociones, setOpcionesEmociones] = useState(['alegría', 'tristeza', 'enojo']);

  const loadData = async () => {
    if (!profile) return;
    try {
      setLoading(true);
      const acts = await db.getActividades(profile.id);
      setActividades(acts);

      const ets = await db.getEtapas(profile.id);
      setEtapas(ets);
    } catch (err) {
      console.error('Error loading activities tab:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [profile]);

  const handleCreateNewClick = () => {
    setIsCreating(true);
    setEditingId(null);
    setTitulo('');
    setEtapaId(etapas[0]?.id || '');
    setTipo('seleccion');
    setInstruccion('');
    setImagenUrl('');
    setMsg({ error: '', success: '' });
  };

  const handleEditClick = (act: Actividad) => {
    setIsCreating(true);
    setEditingId(act.id);
    setTitulo(act.titulo);
    setEtapaId(act.etapa_id || '');
    setTipo(act.tipo);
    setMostrarFelicitacion(act.configuracion.mostrarFelicitacion);
    setVozSintetica(act.configuracion.vozSintetica);

    const firstPreg = act.configuracion.preguntas[0];
    if (firstPreg) {
      setInstruccion(firstPreg.datos.instruccion);
      setImagenUrl(firstPreg.datos.imagenUrl || '');

      // Load type-specific info
      if (firstPreg.tipo === 'seleccion') {
        setOpcionesSeleccion(firstPreg.datos.opciones.map(o => ({ texto: o.texto, esCorrecta: o.esCorrecta })));
      } else if (firstPreg.tipo === 'emparejar') {
        setParejasEmparejar(firstPreg.datos.parejas.map(p => ({ origen: p.origen, destino: p.destino })));
      } else if (firstPreg.tipo === 'clasificar') {
        const cats = firstPreg.datos.categorias.map(c => c.nombre);
        setCategoriasClasificar(cats);
        setElementosClasificar(firstPreg.datos.elementos.map(el => {
          const catIdx = firstPreg.datos.categorias.findIndex(c => c.id === el.categoriaId);
          return { texto: el.texto, categoriaIndex: catIdx !== -1 ? catIdx : 0 };
        }));
      } else if (firstPreg.tipo === 'completar') {
        setOracionCompletar(firstPreg.datos.oracionConHuecos);
        setOpcionesCompletar(firstPreg.datos.palabrasOpciones);
      } else if (firstPreg.tipo === 'reconocer_emociones') {
        setRostroUrl(firstPreg.datos.rostroImagenUrl);
        setEmocionCorrecta(firstPreg.datos.emocionCorrecta);
        setOpcionesEmociones(firstPreg.datos.opciones.map(o => o.emocion));
      }
    }
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({ error: '', success: '' });

    if (!titulo.trim() || !instruccion.trim()) {
      setMsg({ error: 'El título y la instrucción son requeridos.', success: '' });
      return;
    }

    try {
      let preguntaConfig: PreguntaConfig;

      // Construct question payload based on type
      if (tipo === 'seleccion') {
        preguntaConfig = {
          tipo: 'seleccion',
          datos: {
            id: 'preg-1',
            instruccion,
            imagenUrl: imagenUrl || undefined,
            opciones: opcionesSeleccion.map((op, idx) => ({
              id: `op-${idx}`,
              texto: op.texto,
              esCorrecta: op.esCorrecta
            }))
          }
        };
      } else if (tipo === 'emparejar') {
        preguntaConfig = {
          tipo: 'emparejar',
          datos: {
            id: 'preg-1',
            instruccion,
            imagenUrl: imagenUrl || undefined,
            parejas: parejasEmparejar.map((p, idx) => ({
              id: `p-${idx}`,
              origen: p.origen,
              origenTipo: 'texto',
              destino: p.destino,
              destinoTipo: 'texto'
            }))
          }
        };
      } else if (tipo === 'clasificar') {
        const validCats = categoriasClasificar.filter(c => c.trim() !== '');
        const categoriesPayload = validCats.map((cat, idx) => ({ id: `cat-${idx}`, nombre: cat }));
        
        preguntaConfig = {
          tipo: 'clasificar',
          datos: {
            id: 'preg-1',
            instruccion,
            imagenUrl: imagenUrl || undefined,
            categorias: categoriesPayload,
            elementos: elementosClasificar.map((el, idx) => ({
              id: `el-${idx}`,
              texto: el.texto,
              categoriaId: `cat-${el.categoriaIndex}`
            }))
          }
        };
      } else if (tipo === 'completar') {
        // Simple parser to map blank indexes to correct options
        // We look for [word] blocks in the sentence
        const blanks: { [key: number]: string } = {};
        const matches = oracionCompletar.match(/\[(.*?)\]/g) || [];
        matches.forEach((m, idx) => {
          blanks[idx] = m.replace('[', '').replace(']', '');
        });

        preguntaConfig = {
          tipo: 'completar',
          datos: {
            id: 'preg-1',
            instruccion,
            imagenUrl: imagenUrl || undefined,
            oracionConHuecos: oracionCompletar,
            palabrasOpciones: opcionesCompletar.filter(o => o.trim() !== ''),
            respuestasCorrectas: blanks
          }
        };
      } else {
        // reconocer_emociones
        preguntaConfig = {
          tipo: 'reconocer_emociones',
          datos: {
            id: 'preg-1',
            instruccion,
            imagenUrl: imagenUrl || undefined,
            rostroImagenUrl: rostroUrl,
            emocionCorrecta,
            opciones: opcionesEmociones.map((op, idx) => ({
              id: `e-${idx}`,
              emocion: op
            }))
          }
        };
      }

      const actividadPayload = {
        id: editingId || undefined,
        profesor_id: profile!.id,
        etapa_id: etapaId || undefined,
        tipo,
        titulo: titulo.trim(),
        configuracion: {
          preguntas: [preguntaConfig],
          mostrarFelicitacion,
          vozSintetica
        }
      };

      await db.guardarActividad(actividadPayload);
      setMsg({ error: '', success: editingId ? '¡Actividad modificada con éxito!' : '¡Actividad creada con éxito!' });
      setIsCreating(false);
      setEditingId(null);
      await loadData();
    } catch (err: any) {
      setMsg({ error: err.message || 'Error al guardar la actividad.', success: '' });
    }
  };

  return (
    <div className="space-y-6">
      {!isCreating ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border dark:border-gray-700 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Activity className="w-6 h-6 text-blue-600" /> Banco de Actividades ({actividades.length})
              </h2>
              <p className="text-xs text-gray-400 font-semibold">Diseña y edita dinámicas de aprendizaje adaptadas.</p>
            </div>
            
            <button
              onClick={handleCreateNewClick}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-sm transition shadow-md shadow-blue-500/10"
            >
              <PlusCircle className="w-4 h-4" />
              Nueva Actividad
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : actividades.length === 0 ? (
            <div className="text-center py-16 border border-dashed rounded-xl border-gray-200">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-500">No has diseñado ninguna actividad aún.</p>
              <p className="text-xs text-gray-400 mt-1">¡Haz clic en "Nueva Actividad" para comenzar!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {actividades.map((act) => {
                const etapaName = etapas.find(e => e.id === act.etapa_id)?.nombre || 'Sin etapa';
                return (
                  <div key={act.id} className="p-5 border rounded-2xl border-gray-100 dark:border-gray-700 bg-gray-50/50 hover:bg-white dark:bg-gray-900/10 dark:hover:bg-gray-800 flex flex-col justify-between transition gap-4">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full">
                          {act.tipo.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 truncate max-w-[150px]">
                          {etapaName}
                        </span>
                      </div>
                      
                      <h3 className="font-extrabold text-base text-gray-900 dark:text-white leading-snug">
                        {act.titulo}
                      </h3>
                      <p className="text-xs font-semibold text-gray-400 mt-1">
                        {act.configuracion.preguntas.length} pregunta(s) configurada(s)
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t pt-3 dark:border-gray-700/50">
                      <button
                        onClick={() => handleEditClick(act)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 text-gray-500 dark:text-gray-300 rounded-lg text-xs font-bold transition"
                      >
                        <FileEdit className="w-3.5 h-3.5" /> Editar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* CREATOR / EDITOR FORM CONTAINER */
        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl border dark:border-gray-700 shadow-sm max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between border-b pb-4 dark:border-gray-700">
            <div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-600" />
                {editingId ? 'Modificar Actividad Adaptada' : 'Diseñar Nueva Actividad Adaptada'}
              </h2>
              <p className="text-xs text-gray-400 font-bold">Personaliza la accesibilidad y el formato del juego.</p>
            </div>
            
            <button
              onClick={() => setIsCreating(false)}
              className="text-xs font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleGuardar} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Título del juego</label>
                <input
                  type="text"
                  placeholder="Ej: Sumando Manzanas"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Etapa Asociada</label>
                <select
                  value={etapaId}
                  onChange={(e) => setEtapaId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Selecciona etapa (Opcional)</option>
                  {etapas.map(etapa => (
                    <option key={etapa.id} value={etapa.id}>{etapa.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Tipo de Actividad</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as ActividadTipo)}
                  className="w-full px-3 py-2 border rounded-xl text-sm bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-bold"
                >
                  <option value="seleccion">Selección Múltiple</option>
                  <option value="emparejar">Unir Parejas</option>
                  <option value="clasificar">Clasificar en Cajones</option>
                  <option value="completar">Completar la Oración</option>
                  <option value="reconocer_emociones">Reconocer Emociones</option>
                </select>
              </div>

              <div className="flex flex-col justify-center space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={mostrarFelicitacion}
                    onChange={(e) => setMostrarFelicitacion(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  Refuerzo positivo (Confeti + Felicitaciones)
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={vozSintetica}
                    onChange={(e) => setVozSintetica(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  Síntesis de voz automática (TTS)
                </label>
              </div>
            </div>

            {/* QUESTION INSTRUCTION SECTION */}
            <div className="p-5 border-2 border-dashed border-gray-100 rounded-2xl space-y-4 bg-gray-50/50">
              <h3 className="font-extrabold text-sm text-gray-800">1. Configurar Pregunta</h3>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Instrucción o Enunciado para el alumno</label>
                <input
                  type="text"
                  placeholder="Ej: Haz clic en la opción correcta..."
                  value={instruccion}
                  onChange={(e) => setInstruccion(e.target.value)}
                  className="w-full px-3 py-2.5 border rounded-xl text-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">URL de Imagen de Soporte (Opcional)</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={imagenUrl}
                  onChange={(e) => setImagenUrl(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900"
                />
              </div>

              {/* DYNAMIC SUB-FORMS BASED ON ACTIVITY TYPE */}
              <div className="border-t pt-4 mt-2">
                
                {/* 1. SELECCION CONFIG */}
                {tipo === 'seleccion' && (
                  <div className="space-y-3">
                    <span className="block text-xs font-bold text-blue-600 uppercase">Opciones de Selección</span>
                    {opcionesSeleccion.map((op, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <input
                          type="text"
                          placeholder={`Opción ${idx + 1}`}
                          value={op.texto}
                          onChange={(e) => {
                            const val = [...opcionesSeleccion];
                            val[idx].texto = e.target.value;
                            setOpcionesSeleccion(val);
                          }}
                          className="flex-1 px-3 py-2 border rounded-xl text-sm bg-white text-gray-900"
                          required
                        />
                        <label className="flex items-center gap-1 text-xs font-bold">
                          <input
                            type="radio"
                            name="correct_radio"
                            checked={op.esCorrecta}
                            onChange={() => {
                              const val = opcionesSeleccion.map((o, i) => ({ ...o, esCorrecta: i === idx }));
                              setOpcionesSeleccion(val);
                            }}
                          />
                          ¿Correcta?
                        </label>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. EMPAREJAR CONFIG */}
                {tipo === 'emparejar' && (
                  <div className="space-y-3">
                    <span className="block text-xs font-bold text-blue-600 uppercase">Parejas a Unir</span>
                    {parejasEmparejar.map((p, idx) => (
                      <div key={idx} className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder={`Origen ${idx + 1}`}
                          value={p.origen}
                          onChange={(e) => {
                            const val = [...parejasEmparejar];
                            val[idx].origen = e.target.value;
                            setParejasEmparejar(val);
                          }}
                          className="px-3 py-2 border rounded-xl text-sm bg-white text-gray-900"
                          required
                        />
                        <input
                          type="text"
                          placeholder={`Destino ${idx + 1}`}
                          value={p.destino}
                          onChange={(e) => {
                            const val = [...parejasEmparejar];
                            val[idx].destino = e.target.value;
                            setParejasEmparejar(val);
                          }}
                          className="px-3 py-2 border rounded-xl text-sm bg-white text-gray-900"
                          required
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. CLASIFICAR CONFIG */}
                {tipo === 'clasificar' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <span className="block text-xs font-bold text-blue-600 uppercase">Cajones (Categorías)</span>
                      <div className="grid grid-cols-2 gap-4">
                        {categoriasClasificar.map((cat, idx) => (
                          <input
                            key={idx}
                            type="text"
                            placeholder={`Cajón ${idx + 1}`}
                            value={cat}
                            onChange={(e) => {
                              const val = [...categoriasClasificar];
                              val[idx] = e.target.value;
                              setCategoriasClasificar(val);
                            }}
                            className="px-3 py-2 border rounded-xl text-sm bg-white text-gray-900"
                            required
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 border-t pt-3">
                      <span className="block text-xs font-bold text-blue-600 uppercase">Elementos a Organizar</span>
                      {elementosClasificar.map((el, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <input
                            type="text"
                            placeholder={`Elemento ${idx + 1}`}
                            value={el.texto}
                            onChange={(e) => {
                              const val = [...elementosClasificar];
                              val[idx].texto = e.target.value;
                              setElementosClasificar(val);
                            }}
                            className="flex-1 px-3 py-2 border rounded-xl text-sm bg-white text-gray-900"
                            required
                          />
                          <select
                            value={el.categoriaIndex}
                            onChange={(e) => {
                              const val = [...elementosClasificar];
                              val[idx].categoriaIndex = parseInt(e.target.value) || 0;
                              setElementosClasificar(val);
                            }}
                            className="px-3 py-2 border rounded-xl text-xs bg-white text-gray-900 font-bold"
                          >
                            {categoriasClasificar.map((cat, cIdx) => (
                              <option key={cIdx} value={cIdx}>{cat || `Cajón ${cIdx + 1}`}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. COMPLETAR CONFIG */}
                {tipo === 'completar' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-blue-600 uppercase mb-1">
                        Oración con Huecos marcados entre corchetes []
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Las plantas son de color [verde] y el cielo [azul]"
                        value={oracionCompletar}
                        onChange={(e) => setOracionCompletar(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl text-sm bg-white text-gray-900 font-mono"
                        required
                      />
                      <p className="text-[10px] text-gray-400 mt-1">
                        El sistema generará huecos interactivos automáticamente basados en las palabras encerradas en corchetes [].
                      </p>
                    </div>

                    <div className="space-y-2">
                      <span className="block text-xs font-bold text-blue-600 uppercase">Opciones Extras de Palabras</span>
                      <div className="grid grid-cols-3 gap-2">
                        {opcionesCompletar.map((op, idx) => (
                          <input
                            key={idx}
                            type="text"
                            placeholder={`Palabra extra ${idx + 1}`}
                            value={op}
                            onChange={(e) => {
                              const val = [...opcionesCompletar];
                              val[idx] = e.target.value;
                              setOpcionesCompletar(val);
                            }}
                            className="px-3 py-2 border rounded-xl text-xs bg-white text-gray-900"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. EMOCIONES CONFIG */}
                {tipo === 'reconocer_emociones' && (
                  <div className="space-y-3">
                    <span className="block text-xs font-bold text-blue-600 uppercase">Reconocimiento Emocional</span>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">URL Rostro o Pictograma Emotivo</label>
                      <input
                        type="text"
                        value={rostroUrl}
                        onChange={(e) => setRostroUrl(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl text-xs bg-white text-gray-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Emoción Correcta</label>
                      <input
                        type="text"
                        value={emocionCorrecta}
                        onChange={(e) => setEmocionCorrecta(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl text-xs bg-white text-gray-900 font-bold"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <span className="block text-[10px] font-bold text-gray-400 uppercase">Otras Opciones de Emociones</span>
                      <div className="grid grid-cols-3 gap-2">
                        {opcionesEmociones.map((op, idx) => (
                          <input
                            key={idx}
                            type="text"
                            value={op}
                            onChange={(e) => {
                              const val = [...opcionesEmociones];
                              val[idx] = e.target.value;
                              setOpcionesEmociones(val);
                            }}
                            className="px-2 py-2 border rounded-xl text-xs bg-white text-gray-900"
                            required
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {msg.error && <p className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-lg">{msg.error}</p>}
            {msg.success && <p className="text-xs font-bold text-green-600 bg-green-50 p-2.5 rounded-lg">{msg.success}</p>}

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-sm transition shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5"
            >
              <Check className="w-5 h-5" />
              {editingId ? 'Guardar Cambios' : 'Crear Actividad Adaptada'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
