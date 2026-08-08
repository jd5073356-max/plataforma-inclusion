import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, CheckCircle, AlertCircle, ArrowRight, Star, Award, Heart, Shield, RefreshCw } from 'lucide-react';
import { Actividad, PreguntaConfig } from '../../types/actividad';
import { db } from '../../lib/db';
import { Visor3D } from './Visor3D';

interface ReproductorActividadProps {
  actividad: Actividad;
  ajuste?: 'cognitiva' | 'motriz' | 'tea';
  estudianteId: string;
  onCompletado: () => void;
}

export const ReproductorActividad: React.FC<ReproductorActividadProps> = ({
  actividad,
  ajuste,
  estudianteId,
  onCompletado
}) => {
  const [currentPreguntaIndex, setCurrentPreguntaIndex] = useState(0);
  const [selectedOpcionId, setSelectedOpcionId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [intentado, setIntentado] = useState(false);
  const [muted, setMuted] = useState(false);
  
  // Custom states for interactive activity types
  // Emparejar:
  const [colASelected, setColASelected] = useState<string | null>(null);
  const [emparejados, setEmparejados] = useState<{ [key: string]: string }>({}); // origenId -> destinoId
  
  // Clasificar:
  const [clasificado, setClasificado] = useState<{ [key: string]: string }>({}); // elementoId -> categoriaId
  const [selectedElementoId, setSelectedElementoId] = useState<string | null>(null);

  // Completar:
  const [completadosHuecos, setCompletadosHuecos] = useState<{ [index: number]: string }>({});

  const config = actividad.configuracion;
  const pregunta = config.preguntas[currentPreguntaIndex];

  useEffect(() => {
    // Reset responses on changing question
    setSelectedOpcionId(null);
    setIsCorrect(null);
    setIntentado(false);
    setColASelected(null);
    setEmparejados({});
    setClasificado({});
    setSelectedElementoId(null);
    setCompletadosHuecos({});

    // TTS Voice instruction
    if (pregunta && !muted) {
      speakInstruction();
    }
  }, [currentPreguntaIndex, actividad]);

  const speakInstruction = () => {
    const text = pregunta.datos.instruccion;
    if (pregunta.datos.audioUrl) {
      // Use teacher's audio recording if available
      const audio = new Audio(pregunta.datos.audioUrl);
      audio.play().catch(() => {
        // Fallback to TTS if block
        ttsFallback(text);
      });
    } else if (config.vozSintetica) {
      ttsFallback(text);
    }
  };

  const ttsFallback = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      window.speechSynthesis.speak(utterance);
    }
  };

  if (!pregunta) {
    return (
      <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-xl mx-auto">
        <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Actividad sin preguntas</h2>
        <p className="text-gray-600 dark:text-gray-300">Esta actividad no tiene ninguna pregunta configurada.</p>
      </div>
    );
  }

  // ACCESSIBILITY ADJUSTMENTS / THEMES based on 'ajuste'
  const isCognitiva = ajuste === 'cognitiva';
  const isMotriz = ajuste === 'motriz';
  const isTea = ajuste === 'tea';

  // Cognitive: larger text, simpler words, high reinforcement
  // Motor: oversized elements, absolutely NO drag/drop (use clicks)
  // TEA: calm colors, zero animations, ultra-predictable layout, step counter

  const mainBg = isTea ? 'bg-[#f4f6f9]' : isCognitiva ? 'bg-amber-50/20' : 'bg-gray-50';
  const containerClass = `p-6 md:p-8 rounded-2xl shadow-lg border-2 ${
    isTea ? 'border-sky-200 bg-white' : isCognitiva ? 'border-amber-200 bg-white' : 'border-gray-200 bg-white'
  } max-w-4xl mx-auto`;

  const btnClass = (active: boolean) => `
    w-full p-6 text-left rounded-2xl border-4 transition font-bold shadow-sm flex items-center gap-4
    ${isMotriz ? 'text-2xl py-8' : isCognitiva ? 'text-xl' : 'text-lg'}
    ${active 
      ? 'border-blue-600 bg-blue-50 text-blue-950 dark:bg-blue-950/20 dark:text-blue-300' 
      : 'border-gray-300 hover:border-blue-300 bg-white hover:bg-gray-50 text-gray-800 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200 dark:hover:border-gray-600'}
  `;

  // Validation functions
  const verificarSeleccion = async (opcionId: string, esCorrecta: boolean) => {
    setSelectedOpcionId(opcionId);
    setIsCorrect(esCorrecta);
    setIntentado(true);

    await db.registrarIntento(estudianteId, actividad.id, esCorrecta);
  };

  const verificarEmparejar = async () => {
    const datos = pregunta.datos as any;
    let todasCorrectas = true;
    
    datos.parejas.forEach((p: any) => {
      if (emparejados[p.id] !== p.id) {
        todasCorrectas = false;
      }
    });

    setIsCorrect(todasCorrectas);
    setIntentado(true);

    await db.registrarIntento(estudianteId, actividad.id, todasCorrectas);
  };

  const verificarClasificar = async () => {
    const datos = pregunta.datos as any;
    let todasCorrectas = true;

    datos.elementos.forEach((el: any) => {
      if (clasificado[el.id] !== el.categoriaId) {
        todasCorrectas = false;
      }
    });

    setIsCorrect(todasCorrectas);
    setIntentado(true);

    await db.registrarIntento(estudianteId, actividad.id, todasCorrectas);
  };

  const verificarCompletar = async () => {
    const datos = pregunta.datos as any;
    let todasCorrectas = true;

    Object.keys(datos.respuestasCorrectas).forEach((key: any) => {
      const idx = parseInt(key);
      if (completadosHuecos[idx] !== datos.respuestasCorrectas[idx]) {
        todasCorrectas = false;
      }
    });

    setIsCorrect(todasCorrectas);
    setIntentado(true);

    await db.registrarIntento(estudianteId, actividad.id, todasCorrectas);
  };

  const handleSiguiente = () => {
    if (currentPreguntaIndex < config.preguntas.length - 1) {
      setCurrentPreguntaIndex(currentPreguntaIndex + 1);
    } else {
      onCompletado();
    }
  };

  return (
    <div className={`min-h-[80vh] flex flex-col justify-center py-6 px-4 ${mainBg}`}>
      {/* Top Bar with mute, step counter, and adjustment info */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          {ajuste && (
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              isCognitiva ? 'bg-amber-100 text-amber-800' : isMotriz ? 'bg-purple-100 text-purple-800' : 'bg-sky-100 text-sky-800'
            }`}>
              Ajuste: {ajuste === 'cognitiva' ? 'Cognitivo' : ajuste === 'motriz' ? 'Motriz' : 'TEA'}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-500">
            Pregunta {currentPreguntaIndex + 1} de {config.preguntas.length}
          </span>
          <button
            type="button"
            onClick={() => { setMuted(!muted); if (muted) speakInstruction(); }}
            className="p-2.5 bg-white border dark:bg-gray-800 dark:border-gray-700 rounded-full shadow hover:bg-gray-50 transition"
            title={muted ? 'Activar voz' : 'Silenciar voz'}
          >
            {muted ? <VolumeX className="w-5 h-5 text-gray-500" /> : <Volume2 className="w-5 h-5 text-blue-600" />}
          </button>
        </div>
      </div>

      <div className={containerClass}>
        {/* Progress bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 h-3 rounded-full mb-6 overflow-hidden">
          <div 
            className="bg-blue-600 h-full transition-all duration-300" 
            style={{ width: `${((currentPreguntaIndex + 1) / config.preguntas.length) * 100}%` }}
          ></div>
        </div>

        {/* Instruction Section */}
        <div className="mb-6">
          <h1 className={`font-black text-gray-900 dark:text-white leading-snug flex items-start gap-3 ${
            isCognitiva ? 'text-3xl' : 'text-2xl'
          }`}>
            <span className="flex-1">{pregunta.datos.instruccion}</span>
          </h1>
          
          {pregunta.datos.audioUrl && (
            <button
              onClick={() => {
                const a = new Audio(pregunta.datos.audioUrl);
                a.play();
              }}
              className="mt-3 flex items-center gap-2 text-sm text-blue-600 font-bold hover:underline"
            >
              <Volume2 className="w-4 h-4" /> Escuchar de nuevo
            </button>
          )}
        </div>

        {/* Optional Question-level image */}
        {pregunta.datos.imagenUrl && (
          <div className="mb-6 flex justify-center">
            <img 
              src={pregunta.datos.imagenUrl} 
              alt="Instrucción visual" 
              className="max-h-64 object-contain rounded-xl border border-gray-100 shadow" 
            />
          </div>
        )}

        {/* Dynamic Activity Renderers */}
        <div className="mb-8">
          
          {/* 1. SELECCION */}
          {pregunta.tipo === 'seleccion' && (
            <div className="grid grid-cols-1 gap-4">
              {(pregunta.datos as any).opciones.map((op: any) => {
                const isSelected = selectedOpcionId === op.id;
                return (
                  <button
                    key={op.id}
                    type="button"
                    disabled={intentado && !isSelected}
                    onClick={() => verificarSeleccion(op.id, op.esCorrecta)}
                    className={btnClass(isSelected)}
                  >
                    <span className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-lg font-bold border-2 border-gray-300">
                      {op.texto[0].toUpperCase()}
                    </span>
                    <span className="flex-1">{op.texto}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 2. EMPAREJAR */}
          {pregunta.tipo === 'emparejar' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Columna A: Orígenes */}
                <div className="space-y-3">
                  <span className="block text-sm font-bold text-gray-500 mb-1">Columna A</span>
                  {(pregunta.datos as any).parejas.map((p: any) => {
                    const isSelected = colASelected === p.id;
                    const isMatched = emparejados[p.id] !== undefined;
                    return (
                      <button
                        key={`origen-${p.id}`}
                        type="button"
                        disabled={intentado || isMatched}
                        onClick={() => setColASelected(p.id)}
                        className={`w-full p-4 border-4 rounded-2xl font-bold flex items-center justify-between text-left transition ${
                          isSelected 
                            ? 'border-blue-600 bg-blue-50 text-blue-900' 
                            : isMatched 
                              ? 'border-green-200 bg-green-50/50 text-green-950 opacity-60' 
                              : 'border-gray-300 hover:border-blue-300'
                        }`}
                      >
                        <span>{p.origen}</span>
                        {isMatched && <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">Unido</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Columna B: Destinos */}
                <div className="space-y-3">
                  <span className="block text-sm font-bold text-gray-500 mb-1">Columna B</span>
                  {(pregunta.datos as any).parejas.map((p: any) => {
                    const isMatchedWithSelected = colASelected !== null;
                    const matchingOrigenId = Object.keys(emparejados).find(k => emparejados[k] === p.id);
                    
                    return (
                      <button
                        key={`destino-${p.id}`}
                        type="button"
                        disabled={intentado || !isMatchedWithSelected}
                        onClick={() => {
                          if (colASelected) {
                            setEmparejados(prev => ({ ...prev, [colASelected]: p.id }));
                            setColASelected(null);
                          }
                        }}
                        className={`w-full p-4 border-4 rounded-2xl font-bold text-left transition ${
                          matchingOrigenId 
                            ? 'border-green-200 bg-green-50/50 text-green-950 opacity-60' 
                            : isMatchedWithSelected 
                              ? 'border-dashed border-blue-400 hover:border-blue-600 hover:bg-blue-50/30' 
                              : 'border-gray-300 opacity-60'
                        }`}
                      >
                        {p.destino}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reset matching */}
              {!intentado && (
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { setEmparejados({}); setColASelected(null); }}
                    className="flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-red-500 transition"
                  >
                    <RefreshCw className="w-4 h-4" /> Reiniciar uniones
                  </button>
                  <button
                    type="button"
                    onClick={verificarEmparejar}
                    disabled={Object.keys(emparejados).length < (pregunta.datos as any).parejas.length}
                    className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    Comprobar uniones
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 3. CLASIFICAR */}
          {pregunta.tipo === 'clasificar' && (
            <div className="space-y-6">
              {/* Elements to classify */}
              <div className="p-4 border border-dashed rounded-xl bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                <span className="block text-xs font-bold text-gray-500 uppercase mb-2">Toca un elemento:</span>
                <div className="flex flex-wrap gap-2">
                  {(pregunta.datos as any).elementos.map((el: any) => {
                    const isSelected = selectedElementoId === el.id;
                    const categoryName = (pregunta.datos as any).categorias.find((c: any) => c.id === clasificado[el.id])?.nombre;
                    
                    return (
                      <button
                        key={el.id}
                        type="button"
                        disabled={intentado}
                        onClick={() => setSelectedElementoId(el.id)}
                        className={`px-4 py-3 border-2 rounded-xl font-bold shadow-sm transition ${
                          isSelected 
                            ? 'border-blue-600 bg-blue-50 text-blue-900' 
                            : categoryName 
                              ? 'border-green-300 bg-green-50 text-green-950' 
                              : 'border-gray-300 hover:border-blue-400 bg-white'
                        }`}
                      >
                        {el.texto} {categoryName && <span className="text-xs text-green-600 block">({categoryName})</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Categories/Cajones */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(pregunta.datos as any).categorias.map((cat: any) => {
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      disabled={intentado || !selectedElementoId}
                      onClick={() => {
                        if (selectedElementoId) {
                          setClasificado(prev => ({ ...prev, [selectedElementoId]: cat.id }));
                          setSelectedElementoId(null);
                        }
                      }}
                      className={`p-6 border-4 border-dashed rounded-2xl flex flex-col items-center justify-center min-h-[140px] transition ${
                        selectedElementoId 
                          ? 'border-blue-400 hover:border-blue-600 hover:bg-blue-50/20 cursor-pointer' 
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      <span className="text-xl font-extrabold text-blue-900">{cat.nombre}</span>
                      <span className="text-xs text-gray-500 mt-1">
                        {selectedElementoId ? 'Toca para colocar aquí' : 'Cajón'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {!intentado && (
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { setClasificado({}); setSelectedElementoId(null); }}
                    className="flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-red-500 transition"
                  >
                    <RefreshCw className="w-4 h-4" /> Limpiar cajones
                  </button>
                  <button
                    type="button"
                    onClick={verificarClasificar}
                    disabled={Object.keys(clasificado).length < (pregunta.datos as any).elementos.length}
                    className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    Verificar Cajones
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 4. COMPLETAR */}
          {pregunta.tipo === 'completar' && (
            <div className="space-y-6">
              {/* Sentence displaying options as empty placeholders */}
              <div className="p-6 border rounded-2xl bg-gray-50 dark:bg-gray-800 text-xl font-bold leading-loose text-center text-gray-800 dark:text-gray-100">
                {(pregunta.datos as any).oracionConHuecos.split(/\[.*?\]/g).map((chunk: string, idx: number, arr: any[]) => {
                  return (
                    <React.Fragment key={idx}>
                      <span>{chunk}</span>
                      {idx < arr.length - 1 && (
                        <span className="inline-block border-b-4 border-dashed border-blue-600 min-w-[100px] px-3 py-1 text-blue-700 bg-blue-50/50 rounded text-center mx-2 font-black">
                          {completadosHuecos[idx] || '¿?'}
                        </span>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Options to click */}
              <div className="space-y-2">
                <span className="block text-xs font-bold text-gray-500 uppercase text-center">Toca la palabra adecuada:</span>
                <div className="flex flex-wrap gap-2 justify-center">
                  {(pregunta.datos as any).palabrasOpciones.map((pala: string) => {
                    return (
                      <button
                        key={pala}
                        type="button"
                        disabled={intentado}
                        onClick={() => {
                          // Find first empty slot
                          const totalSlots = Object.keys((pregunta.datos as any).respuestasCorrectas).length;
                          let slotIndex = 0;
                          while (slotIndex < totalSlots) {
                            if (!completadosHuecos[slotIndex]) {
                              break;
                            }
                            slotIndex++;
                          }
                          if (slotIndex < totalSlots) {
                            setCompletadosHuecos(prev => ({ ...prev, [slotIndex]: pala }));
                          }
                        }}
                        className="px-5 py-3 border-2 border-gray-300 hover:border-blue-500 rounded-xl font-black bg-white hover:bg-blue-50 text-gray-800 shadow-sm transition"
                      >
                        {pala}
                      </button>
                    );
                  })}
                </div>
              </div>

              {!intentado && (
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setCompletadosHuecos({})}
                    className="flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-red-500 transition"
                  >
                    <RefreshCw className="w-4 h-4" /> Reiniciar frase
                  </button>
                  <button
                    type="button"
                    onClick={verificarCompletar}
                    className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow hover:bg-blue-700 transition"
                  >
                    Verificar frase
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 5. RECONOCER EMOCIONES */}
          {pregunta.tipo === 'reconocer_emociones' && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <img
                  src={(pregunta.datos as any).rostroImagenUrl}
                  alt="Imagen de expresión o emoción"
                  className="max-h-64 object-contain rounded-2xl border border-gray-100 shadow"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(pregunta.datos as any).opciones.map((op: any) => {
                  const isSelected = selectedOpcionId === op.id;
                  const isCorrectAnswer = op.emocion.toLowerCase() === (pregunta.datos as any).emocionCorrecta.toLowerCase();
                  
                  return (
                    <button
                      key={op.id}
                      type="button"
                      disabled={intentado && !isSelected}
                      onClick={() => verificarSeleccion(op.id, isCorrectAnswer)}
                      className={btnClass(isSelected)}
                    >
                      <span className="capitalize w-full text-center">{op.emocion}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6. EXPLORADOR 3D */}
          {pregunta.tipo === 'explorador_3d' && (
            <div className="space-y-6">
              <Visor3D
                modeloUrl={(pregunta.datos as any).modeloUrl}
                nombreObjeto={(pregunta.datos as any).nombreObjeto}
                puntosDeInteres={(pregunta.datos as any).puntosDeInteres}
              />
            </div>
          )}

          {/* 7. AUTOEVALUACIÓN (tablero de sonrisas) */}
          {pregunta.tipo === 'autoevaluacion' && (
            <div className="space-y-6">
              {(pregunta.datos as any).reflexion && (
                <p className="text-center text-lg font-bold text-gray-700">
                  {(pregunta.datos as any).reflexion}
                </p>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(pregunta.datos as any).escala.map((op: any) => {
                  const isSelected = selectedOpcionId === op.id;
                  const esCorrecta = op.id === 'muy_bien';
                  return (
                    <button
                      key={op.id}
                      type="button"
                      disabled={intentado && !isSelected}
                      onClick={() => verificarSeleccion(op.id, esCorrecta)}
                      className={`w-full p-6 text-center rounded-2xl border-4 transition font-bold shadow-sm flex flex-col items-center gap-3 ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-50' 
                          : 'border-gray-300 hover:border-blue-300 bg-white hover:bg-gray-50'
                      } ${op.color || ''}`}
                    >
                      <span className="text-5xl">{op.emoji}</span>
                      <span className="text-lg">{op.etiqueta}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-center text-sm text-gray-500 font-semibold">
                Marca cómo te sentiste al terminar la actividad.
              </p>
            </div>
          )}
        </div>

        {/* FEEDBACK & CONTINUATION PANEL */}
        {intentado && (
          <div className={`p-6 rounded-2xl border-4 ${
            isCorrect 
              ? 'border-green-500 bg-green-50/50 text-green-950 dark:bg-green-950/20' 
              : 'border-red-400 bg-red-50/30 text-red-950 dark:bg-red-950/10'
          } animate-slideUp`}>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full bg-white shadow">
                {isCorrect ? (
                  <Star className="w-8 h-8 text-green-600 fill-current" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-red-600" />
                )}
              </div>

              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-extrabold">
                  {isCorrect ? '¡Excelente trabajo!' : '¡Sigue intentándolo!'}
                </h3>
                <p className="text-sm opacity-90 mt-1">
                  {isCorrect 
                    ? 'Has resuelto este ejercicio a la perfección.' 
                    : 'Puedes revisar la pregunta de nuevo o pasar a la siguiente.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleSiguiente}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-extrabold rounded-2xl shadow hover:bg-blue-700 transition"
              >
                <span>{currentPreguntaIndex < config.preguntas.length - 1 ? 'Siguiente Pregunta' : 'Completar Actividad'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReproductorActividad;
