import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/db';
import { Actividad, ActividadTipo, Etapa, PreguntaConfig } from '../../types/actividad';
import ReproductorEnfocado from '../../components/reproductor/ReproductorEnfocado';
import GrabadorVoz from '../../components/comunes/GrabadorVoz';
import SubeImagen from '../../components/comunes/SubeImagen';
import {
  PlusCircle,
  FileEdit,
  Activity,
  RefreshCw,
  Check,
  Eye,
  X,
  Recycle,
  ArrowRight,
  Trash2,
  Mic,
  Plus
} from 'lucide-react';

interface ActividadesProps {
  actividadInicialEditar?: Actividad | null;
  onCerrarEdicionExterna?: () => void;
}

export default function Actividades({
  actividadInicialEditar = null,
  onCerrarEdicionExterna
}: ActividadesProps = {}) {
  const { profile } = useAuth();
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ error: '', success: '' });
  const [previewActividad, setPreviewActividad] = useState<Actividad | null>(null);

  // Reciclaje de plantillas hacia rutas
  const [reciclandoActividad, setReciclandoActividad] = useState<Actividad | null>(null);
  const [rutaDestinoId, setRutaDestinoId] = useState('');

  // Crear directamente en ruta o en el banco
  const [etapaAsignadaId, setEtapaAsignadaId] = useState<string>('');
  const [ordenAsignado, setOrdenAsignado] = useState<number | undefined>(undefined);

  // Creation/Editing Form State
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState<ActividadTipo>('seleccion');
  const [mostrarFelicitacion, setMostrarFelicitacion] = useState(true);
  const [vozSintetica, setVozSintetica] = useState(true);
  const [videoUrlActividad, setVideoUrlActividad] = useState('');

  // Multi-question support: guardamos las preguntas adicionales y editamos la activa
  const [preguntasGuardadas, setPreguntasGuardadas] = useState<PreguntaConfig[]>([]);
  const [preguntaActivaIdx, setPreguntaActivaIdx] = useState(0);

  // Estado de la pregunta activa en el formulario
  const [instruccion, setInstruccion] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');

  // 1. Selección y Escuchar/Responder
  const [opcionesSeleccion, setOpcionesSeleccion] = useState([
    { texto: '', esCorrecta: true, imagenUrl: '' },
    { texto: '', esCorrecta: false, imagenUrl: '' },
    { texto: '', esCorrecta: false, imagenUrl: '' }
  ]);
  const [audioPreguntaUrl, setAudioPreguntaUrl] = useState('/multimedia/audios/pajaro.wav');

  // 2. Emparejar
  const [parejasEmparejar, setParejasEmparejar] = useState([
    { origen: '', destino: '' },
    { origen: '', destino: '' },
    { origen: '', destino: '' }
  ]);

  // 3. Clasificar
  const [categoriasClasificar, setCategoriasClasificar] = useState(['Categoría 1', 'Categoría 2']);
  const [elementosClasificar, setElementosClasificar] = useState([
    { texto: '', categoriaIndex: 0 },
    { texto: '', categoriaIndex: 1 }
  ]);

  // 4. Completar
  const [oracionCompletar, setOracionCompletar] = useState('');
  const [opcionesCompletar, setOpcionesCompletar] = useState(['', '', '']);

  // 5. Ordenar (secuencia)
  const [pasosOrdenar, setPasosOrdenar] = useState(['', '', '']);

  // 6. Memoria (parejas de cartas)
  const [parejasMemoria, setParejasMemoria] = useState([
    { cartaA: '', cartaB: '' },
    { cartaA: '', cartaB: '' },
    { cartaA: '', cartaB: '' }
  ]);

  // 7. Identificar (cuadrícula visual)
  const [elementosIdentificar, setElementosIdentificar] = useState([
    { nombre: '', imagenUrl: '/multimedia/img/oso_polar.jpg', esCorrecto: true },
    { nombre: '', imagenUrl: '/multimedia/img/leon.jpg', esCorrecto: false }
  ]);

  // 8. Trazar o Colorear
  const [lienzoFondoUrl, setLienzoFondoUrl] = useState('/multimedia/img/cuerpo_cerebro.jpg');
  const [colorSugerido, setColorSugerido] = useState('#EE7C6A');

  // 9. Reconocer Emociones
  const [rostroUrl, setRostroUrl] = useState('/multimedia/img/emocion_alegria.jpg');
  const [emocionCorrecta, setEmocionCorrecta] = useState('alegría');
  const [opcionesEmociones, setOpcionesEmociones] = useState(['alegría', 'tristeza', 'enojo']);

  // 10. Autoevaluación
  const [reflexionAutoeval, setReflexionAutoeval] = useState('¿Cómo te sentiste al terminar la actividad?');

  const loadData = async () => {
    if (!profile) return;
    try {
      setLoading(true);
      const [acts, ets] = await Promise.all([
        db.getBanco(profile.id),
        db.getEtapas(profile.id)
      ]);
      setActividades(acts);
      setEtapas(ets);
    } catch (err) {
      console.error('Error loading bank tab:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [profile]);

  useEffect(() => {
    if (actividadInicialEditar) {
      handleEditClick(actividadInicialEditar);
    }
  }, [actividadInicialEditar]);

  const abrirReciclaje = (act: Actividad) => {
    setReciclandoActividad(act);
    setRutaDestinoId('');
    setMsg({ error: '', success: '' });
  };

  const confirmarReciclaje = async () => {
    if (!reciclandoActividad || !rutaDestinoId || !profile) return;
    try {
      await db.reciclarARuta(reciclandoActividad.id, rutaDestinoId, profile.id);
      const nombreRuta = etapas.find(e => e.id === rutaDestinoId)?.nombre || 'la ruta';
      setReciclandoActividad(null);
      setMsg({ error: '', success: `¡Copiada a ${nombreRuta} como siguiente paso!` });
    } catch (err) {
      setMsg({ error: err instanceof Error ? err.message : 'Error al reciclar la plantilla.', success: '' });
    }
  };

  const handleEliminarPlantilla = async (act: Actividad) => {
    if (!window.confirm(`¿Eliminar la actividad «${act.titulo}»?`)) return;
    try {
      await db.eliminarPaso(act.id);
      setMsg({ error: '', success: 'Actividad eliminada.' });
      await loadData();
    } catch (err) {
      setMsg({ error: err instanceof Error ? err.message : 'No se pudo eliminar.', success: '' });
    }
  };

  const cargarPreguntaEnFormulario = (preg: PreguntaConfig) => {
    setTipo(preg.tipo);
    setInstruccion(preg.datos.instruccion || '');
    setImagenUrl(preg.datos.imagenUrl || '');
    setAudioUrl(preg.datos.audioUrl || '');

    if (preg.tipo === 'seleccion') {
      setOpcionesSeleccion(
        preg.datos.opciones.map(o => ({ texto: o.texto, esCorrecta: o.esCorrecta, imagenUrl: o.imagenUrl || '' }))
      );
    } else if (preg.tipo === 'escuchar_responder') {
      setAudioPreguntaUrl(preg.datos.audioPreguntaUrl || '/multimedia/audios/pajaro.wav');
      setOpcionesSeleccion(
        preg.datos.opciones.map(o => ({ texto: o.texto, esCorrecta: o.esCorrecta, imagenUrl: o.imagenUrl || '' }))
      );
    } else if (preg.tipo === 'emparejar') {
      setParejasEmparejar(preg.datos.parejas.map(p => ({ origen: p.origen, destino: p.destino })));
    } else if (preg.tipo === 'clasificar') {
      const cats = preg.datos.categorias.map(c => c.nombre);
      setCategoriasClasificar(cats);
      setElementosClasificar(
        preg.datos.elementos.map(el => {
          const catIdx = preg.datos.categorias.findIndex(c => c.id === el.categoriaId);
          return { texto: el.texto, categoriaIndex: catIdx !== -1 ? catIdx : 0 };
        })
      );
    } else if (preg.tipo === 'completar') {
      setOracionCompletar(preg.datos.oracionConHuecos);
      setOpcionesCompletar(preg.datos.palabrasOpciones);
    } else if (preg.tipo === 'ordenar') {
      const ordenados = [...preg.datos.elementos].sort((a, b) => a.ordenCorrecto - b.ordenCorrecto);
      setPasosOrdenar(ordenados.map(e => e.texto));
    } else if (preg.tipo === 'memoria') {
      const grupos: Record<string, string[]> = {};
      preg.datos.cartas.forEach(c => {
        if (!grupos[c.parejaId]) grupos[c.parejaId] = [];
        grupos[c.parejaId].push(c.valor);
      });
      const pares = Object.values(grupos).map(vals => ({ cartaA: vals[0] || '', cartaB: vals[1] || '' }));
      setParejasMemoria(pares.length > 0 ? pares : [{ cartaA: '', cartaB: '' }, { cartaA: '', cartaB: '' }]);
    } else if (preg.tipo === 'identificar') {
      setElementosIdentificar(
        preg.datos.elementos.map(e => ({
          nombre: e.nombre,
          imagenUrl: e.imagenUrl || '/multimedia/img/oso_polar.jpg',
          esCorrecto: e.esCorrecto
        }))
      );
    } else if (preg.tipo === 'trazar_colorear') {
      setLienzoFondoUrl(preg.datos.lienzoFondoUrl || '/multimedia/img/cuerpo_cerebro.jpg');
      setColorSugerido(preg.datos.colorSugerido || '#EE7C6A');
    } else if (preg.tipo === 'reconocer_emociones') {
      setRostroUrl(preg.datos.rostroImagenUrl);
      setEmocionCorrecta(preg.datos.emocionCorrecta);
      setOpcionesEmociones(preg.datos.opciones.map(o => o.emocion));
    } else if (preg.tipo === 'autoevaluacion') {
      setReflexionAutoeval(preg.datos.reflexion || '');
    }
  };

  const handleCreateNewClick = () => {
    setIsCreating(true);
    setEditingId(null);
    setEtapaAsignadaId('');
    setOrdenAsignado(undefined);
    setTitulo('');
    setTipo('seleccion');
    setVideoUrlActividad('');
    setInstruccion('');
    setImagenUrl('');
    setAudioUrl('');
    setPreguntasGuardadas([]);
    setPreguntaActivaIdx(0);
    setOpcionesSeleccion([
      { texto: '', esCorrecta: true, imagenUrl: '' },
      { texto: '', esCorrecta: false, imagenUrl: '' },
      { texto: '', esCorrecta: false, imagenUrl: '' }
    ]);
    setMsg({ error: '', success: '' });
  };

  const handleEditClick = (act: Actividad) => {
    setIsCreating(true);
    setEditingId(act.id);
    setEtapaAsignadaId(act.etapa_id || '');
    setOrdenAsignado(act.orden);
    setTitulo(act.titulo);
    setTipo(act.tipo);
    setVideoUrlActividad(act.video_url || '');
    setMostrarFelicitacion(act.configuracion.mostrarFelicitacion);
    setVozSintetica(act.configuracion.vozSintetica);

    const listaPregs = act.configuracion.preguntas || [];
    setPreguntasGuardadas(listaPregs);
    setPreguntaActivaIdx(0);
    if (listaPregs[0]) {
      cargarPreguntaEnFormulario(listaPregs[0]);
    }
  };

  const construirPreguntaConfig = (): PreguntaConfig => {
    const idPreg = `preg-${preguntaActivaIdx + 1}-${Date.now().toString(36).slice(-4)}`;
    const base = {
      id: idPreg,
      instruccion: instruccion.trim(),
      imagenUrl: imagenUrl.trim() || undefined,
      audioUrl: audioUrl.trim() || undefined
    };

    if (tipo === 'seleccion') {
      return {
        tipo: 'seleccion',
        datos: {
          ...base,
          opciones: opcionesSeleccion.map((op, idx) => ({
            id: `op-${idx + 1}`,
            texto: op.texto,
            imagenUrl: op.imagenUrl?.trim() || undefined,
            esCorrecta: op.esCorrecta
          }))
        }
      };
    } else if (tipo === 'escuchar_responder') {
      return {
        tipo: 'escuchar_responder',
        datos: {
          ...base,
          audioPreguntaUrl: audioPreguntaUrl.trim() || audioUrl.trim() || '/multimedia/audios/pajaro.wav',
          opciones: opcionesSeleccion.map((op, idx) => ({
            id: `op-${idx + 1}`,
            texto: op.texto,
            imagenUrl: op.imagenUrl?.trim() || undefined,
            esCorrecta: op.esCorrecta
          }))
        }
      };
    } else if (tipo === 'emparejar') {
      return {
        tipo: 'emparejar',
        datos: {
          ...base,
          parejas: parejasEmparejar.map((p, idx) => ({
            id: `p-${idx + 1}`,
            origen: p.origen,
            origenTipo: p.origen.startsWith('/') || p.origen.startsWith('http') || p.origen.startsWith('data:image') ? 'imagen' : 'texto',
            destino: p.destino,
            destinoTipo: p.destino.startsWith('/') || p.destino.startsWith('http') || p.destino.startsWith('data:image') ? 'imagen' : 'texto'
          }))
        }
      };
    } else if (tipo === 'clasificar') {
      const validCats = categoriasClasificar.filter(c => c.trim() !== '');
      const categoriesPayload = validCats.map((cat, idx) => ({ id: `cat-${idx}`, nombre: cat }));
      return {
        tipo: 'clasificar',
        datos: {
          ...base,
          categorias: categoriesPayload,
          elementos: elementosClasificar.map((el, idx) => ({
            id: `el-${idx + 1}`,
            texto: el.texto,
            categoriaId: `cat-${el.categoriaIndex}`
          }))
        }
      };
    } else if (tipo === 'completar') {
      const blanks: { [key: number]: string } = {};
      const matches = oracionCompletar.match(/\[(.*?)\]/g) || [];
      matches.forEach((m, idx) => {
        blanks[idx] = m.replace('[', '').replace(']', '');
      });
      const palabrasEnHuecos = Object.values(blanks);
      const todasPalabras = Array.from(
        new Set([...palabrasEnHuecos, ...opcionesCompletar.map(o => o.trim()).filter(Boolean)])
      );
      return {
        tipo: 'completar',
        datos: {
          ...base,
          oracionConHuecos: oracionCompletar,
          palabrasOpciones: todasPalabras,
          respuestasCorrectas: blanks
        }
      };
    } else if (tipo === 'ordenar') {
      return {
        tipo: 'ordenar',
        datos: {
          ...base,
          elementos: pasosOrdenar
            .filter(p => p.trim() !== '')
            .map((textoPaso, idx) => ({
              id: `ord-${idx + 1}`,
              texto: textoPaso,
              ordenCorrecto: idx + 1
            }))
        }
      };
    } else if (tipo === 'memoria') {
      const cartas: { id: string; valor: string; tipo: 'texto' | 'imagen'; parejaId: string }[] = [];
      parejasMemoria.forEach((par, idx) => {
        if (!par.cartaA.trim() && !par.cartaB.trim()) return;
        const pid = `par-${idx + 1}`;
        const esImg = (v: string) => v.startsWith('/') || v.startsWith('http') || v.startsWith('data:image');
        cartas.push({
          id: `c-${idx * 2 + 1}`,
          valor: par.cartaA.trim(),
          tipo: esImg(par.cartaA.trim()) ? 'imagen' : 'texto',
          parejaId: pid
        });
        cartas.push({
          id: `c-${idx * 2 + 2}`,
          valor: par.cartaB.trim(),
          tipo: esImg(par.cartaB.trim()) ? 'imagen' : 'texto',
          parejaId: pid
        });
      });
      return {
        tipo: 'memoria',
        datos: {
          ...base,
          cartas
        }
      };
    } else if (tipo === 'identificar') {
      return {
        tipo: 'identificar',
        datos: {
          ...base,
          elementos: elementosIdentificar.map((el, idx) => ({
            id: `id-${idx + 1}`,
            nombre: el.nombre,
            imagenUrl: el.imagenUrl || '/multimedia/img/oso_polar.jpg',
            esCorrecto: el.esCorrecto
          }))
        }
      };
    } else if (tipo === 'trazar_colorear') {
      return {
        tipo: 'trazar_colorear',
        datos: {
          ...base,
          lienzoFondoUrl: lienzoFondoUrl || '/multimedia/img/cuerpo_cerebro.jpg',
          colorSugerido: colorSugerido || '#EE7C6A',
          puntosDeTrazo: [
            { x: 140, y: 190 },
            { x: 340, y: 110 },
            { x: 540, y: 190 }
          ]
        }
      };
    } else if (tipo === 'reconocer_emociones') {
      return {
        tipo: 'reconocer_emociones',
        datos: {
          ...base,
          rostroImagenUrl: rostroUrl,
          emocionCorrecta,
          opciones: opcionesEmociones.map((op, idx) => ({
            id: `e-${idx + 1}`,
            emocion: op
          }))
        }
      };
    } else {
      return {
        tipo: 'autoevaluacion',
        datos: {
          ...base,
          escala: [
            { id: 'muy_bien', etiqueta: '😃 ❤️ ¡Muy bien, lo logré!', emoji: '😃', color: 'bg-emerald-100 border-emerald-500 text-emerald-900' },
            { id: 'bien', etiqueta: '👍 Bien', emoji: '👍', color: 'bg-blue-100 border-blue-500 text-blue-900' },
            { id: 'regular', etiqueta: '😐 En proceso', emoji: '😐', color: 'bg-amber-100 border-amber-500 text-amber-900' },
            { id: 'necesito_ayuda', etiqueta: '🤝 Necesito apoyo', emoji: '🤝', color: 'bg-rose-100 border-rose-500 text-rose-900' }
          ],
          reflexion: reflexionAutoeval || undefined
        }
      };
    }
  };

  const obtenerListaPreguntasActualizada = (): PreguntaConfig[] => {
    const actual = construirPreguntaConfig();
    if (preguntasGuardadas.length === 0) return [actual];
    const copia = [...preguntasGuardadas];
    copia[preguntaActivaIdx] = actual;
    return copia;
  };

  const cambiarPreguntaActiva = (nuevoIdx: number) => {
    if (instruccion.trim()) {
      const actualizada = obtenerListaPreguntasActualizada();
      setPreguntasGuardadas(actualizada);
      if (actualizada[nuevoIdx]) {
        cargarPreguntaEnFormulario(actualizada[nuevoIdx]);
      }
    } else if (preguntasGuardadas[nuevoIdx]) {
      cargarPreguntaEnFormulario(preguntasGuardadas[nuevoIdx]);
    }
    setPreguntaActivaIdx(nuevoIdx);
  };

  const anadirNuevaPregunta = () => {
    if (!instruccion.trim()) {
      setMsg({ error: 'Completa la instrucción de la pregunta actual antes de añadir otra.', success: '' });
      return;
    }
    const actualizada = obtenerListaPreguntasActualizada();
    const nuevaPreguntaVacia: PreguntaConfig = {
      tipo: 'seleccion',
      datos: {
        id: `preg-${actualizada.length + 1}`,
        instruccion: '',
        opciones: [
          { id: 'op-1', texto: '', esCorrecta: true },
          { id: 'op-2', texto: '', esCorrecta: false },
          { id: 'op-3', texto: '', esCorrecta: false }
        ]
      }
    };
    const nuevaLista = [...actualizada, nuevaPreguntaVacia];
    setPreguntasGuardadas(nuevaLista);
    setPreguntaActivaIdx(nuevaLista.length - 1);
    cargarPreguntaEnFormulario(nuevaPreguntaVacia);
    setMsg({ error: '', success: `Pregunta ${nuevaLista.length} añadida.` });
  };

  const eliminarPreguntaActual = () => {
    if (preguntasGuardadas.length <= 1) return;
    const filtrada = preguntasGuardadas.filter((_, idx) => idx !== preguntaActivaIdx);
    const nuevoIdx = Math.max(0, preguntaActivaIdx - 1);
    setPreguntasGuardadas(filtrada);
    setPreguntaActivaIdx(nuevoIdx);
    cargarPreguntaEnFormulario(filtrada[nuevoIdx]);
  };

  const handleGuardarAudioGrabado = async (blobOrFile: Blob | File, esAudioPregunta = false) => {
    if (!profile) return;
    try {
      const urlSubida = await db.subirRecurso(blobOrFile, 'audio', profile.id);
      if (esAudioPregunta) {
        setAudioPreguntaUrl(urlSubida);
      } else {
        setAudioUrl(urlSubida);
      }
      setMsg({ error: '', success: '🎙️ ¡Audio grabado y vinculado a la pregunta con éxito!' });
    } catch (err) {
      setMsg({ error: err instanceof Error ? err.message : 'Error al subir el audio grabado.', success: '' });
    }
  };

  const handleSeleccionarImagen = async (urlOrFile: string | File) => {
    if (!profile) return;
    if (typeof urlOrFile === 'string') {
      setImagenUrl(urlOrFile);
      return;
    }
    try {
      const urlSubida = await db.subirRecurso(urlOrFile, 'imagen', profile.id);
      setImagenUrl(urlSubida);
      setMsg({ error: '', success: '🖼️ ¡Imagen cargada correctamente!' });
    } catch (err) {
      setMsg({ error: err instanceof Error ? err.message : 'Error al subir la imagen.', success: '' });
    }
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({ error: '', success: '' });

    if (!titulo.trim() || !instruccion.trim()) {
      setMsg({ error: 'El título de la actividad y la instrucción de la pregunta son requeridos.', success: '' });
      return;
    }

    try {
      const listaFinalPreguntas = obtenerListaPreguntasActualizada();
      let ordenFinal = ordenAsignado;
      if (etapaAsignadaId && ordenFinal === undefined) {
        const pasosExistentes = await db.getPasosDeEtapa(etapaAsignadaId);
        ordenFinal = pasosExistentes.length > 0 ? Math.max(...pasosExistentes.map(p => p.orden ?? 0)) + 1 : 1;
      }

      const actividadPayload: Omit<Actividad, 'id'> & { id?: string } = {
        id: editingId || undefined,
        profesor_id: profile!.id,
        etapa_id: etapaAsignadaId ? etapaAsignadaId : undefined,
        orden: etapaAsignadaId ? ordenFinal : undefined,
        tipo: listaFinalPreguntas[0]?.tipo || tipo,
        titulo: titulo.trim(),
        imagen_url: listaFinalPreguntas[0]?.datos.imagenUrl || undefined,
        video_url: videoUrlActividad.trim() || undefined,
        configuracion: {
          preguntas: listaFinalPreguntas,
          mostrarFelicitacion,
          vozSintetica
        }
      };

      await db.guardarActividad(actividadPayload);
      setMsg({
        error: '',
        success: editingId ? '¡Actividad modificada con éxito!' : '¡Actividad creada con éxito!'
      });
      setIsCreating(false);
      setEditingId(null);
      await loadData();
      if (onCerrarEdicionExterna) onCerrarEdicionExterna();
    } catch (err) {
      setMsg({ error: err instanceof Error ? err.message : 'Error al guardar la actividad.', success: '' });
    }
  };

  const handlePreviewForm = () => {
    setMsg({ error: '', success: '' });
    if (!titulo.trim() || !instruccion.trim()) {
      setMsg({ error: 'El título y la instrucción son requeridos para la vista previa.', success: '' });
      return;
    }

    const listaFinalPreguntas = obtenerListaPreguntasActualizada();
    const actividadPreview: Actividad = {
      id: editingId || 'preview',
      profesor_id: profile!.id,
      tipo: listaFinalPreguntas[0]?.tipo || tipo,
      titulo: titulo.trim(),
      imagen_url: listaFinalPreguntas[0]?.datos.imagenUrl || undefined,
      video_url: videoUrlActividad.trim() || undefined,
      configuracion: {
        preguntas: listaFinalPreguntas,
        mostrarFelicitacion,
        vozSintetica
      }
    };
    setPreviewActividad(actividadPreview);
  };

  return (
    <div className="space-y-6 font-sans-atelier">
      {!isCreating ? (
        <div className="bg-white p-6 rounded-[28px] border border-[#EFECE6] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-serif-atelier font-bold text-[#1C1917] flex items-center gap-2">
                <Activity className="w-6 h-6 text-[#EE7C6A]" /> Banco de Actividades ({actividades.length})
              </h2>
              <p className="text-xs text-[#78716C]">
                Diseña actividades con tu propia voz grabada, imágenes y 11 dinámicas interactivas.
              </p>
            </div>

            <button
              onClick={handleCreateNewClick}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#EE7C6A] hover:bg-[#E46653] text-white font-bold rounded-2xl text-xs transition shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              Nueva Actividad (Con Grabación de Audio)
            </button>
          </div>

          {msg.error && <p className="text-xs font-bold text-[#D9363E] bg-[#FFF2F0] p-3 rounded-xl">{msg.error}</p>}
          {msg.success && <p className="text-xs font-bold text-[#10B981] bg-[#ECFDF5] p-3 rounded-xl">{msg.success}</p>}

          {loading ? (
            <div className="flex justify-center py-10">
              <RefreshCw className="w-8 h-8 text-[#EE7C6A] animate-spin" />
            </div>
          ) : actividades.length === 0 ? (
            <div className="text-center py-16 border border-dashed rounded-2xl border-[#EFECE6]">
              <Activity className="w-12 h-12 text-[#A8A29E] mx-auto mb-3 opacity-50" />
              <p className="text-xs font-semibold text-[#78716C]">No has diseñado ninguna actividad aún.</p>
              <p className="text-xs text-[#A8A29E] mt-1">¡Haz clic en «Nueva Actividad» para comenzar!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {actividades.map((act) => {
                const tieneAudio = act.configuracion.preguntas.some(
                  p => Boolean(p.datos.audioUrl || (p.datos as any).audioPreguntaUrl)
                );
                return (
                  <div
                    key={act.id}
                    className="p-5 border rounded-[24px] border-[#EFECE6] bg-[#FBF9F5] hover:bg-white flex flex-col justify-between transition gap-4 shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-[#EE7C6A]/10 text-[#EE7C6A] px-3 py-1 rounded-full">
                          {act.tipo.replace(/_/g, ' ')}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {tieneAudio && (
                            <span className="text-[10px] font-bold text-[#065F46] bg-[#ECFDF5] px-2.5 py-1 rounded-full flex items-center gap-1">
                              <Mic className="w-3 h-3" /> Con audio
                            </span>
                          )}
                          <span className="text-[10px] font-bold text-[#78716C] bg-[#F5F2EC] px-2.5 py-1 rounded-full">
                            {act.configuracion.preguntas.length} preg.
                          </span>
                        </div>
                      </div>

                      <h3 className="font-serif-atelier font-bold text-xl text-[#1C1917] leading-snug">
                        {act.titulo}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-1.5 border-t pt-3 border-[#EFECE6]">
                      <button
                        type="button"
                        onClick={() => setPreviewActividad(act)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white border border-[#EFECE6] hover:bg-[#EE7C6A]/10 hover:text-[#EE7C6A] text-[#57534E] rounded-full text-xs font-bold transition"
                      >
                        <Eye className="w-3.5 h-3.5" /> Probar
                      </button>
                      <button
                        type="button"
                        onClick={() => abrirReciclaje(act)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#10B981]/10 hover:bg-[#10B981]/20 text-[#10B981] rounded-full text-xs font-bold transition"
                      >
                        <Recycle className="w-3.5 h-3.5" /> Usar en ruta
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditClick(act)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#F5F2EC] hover:bg-[#EBE8E0] text-[#57534E] rounded-full text-xs font-bold transition"
                      >
                        <FileEdit className="w-3.5 h-3.5" /> Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEliminarPlantilla(act)}
                        className="p-1.5 text-[#A8A29E] hover:text-[#D9363E] hover:bg-[#FFF2F0] rounded-full transition"
                        title="Eliminar plantilla"
                      >
                        <Trash2 className="w-4 h-4" />
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
        <div className="bg-white p-6 md:p-8 rounded-[28px] border border-[#EFECE6] shadow-sm max-w-4xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 border-[#EFECE6]">
            <div>
              <h2 className="text-xl font-serif-atelier font-bold text-[#1C1917] flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#EE7C6A]" />
                {editingId ? 'Modificar Actividad Adaptada' : 'Diseñar Nueva Actividad Adaptada'}
              </h2>
              <p className="text-xs text-[#78716C] font-medium">
                Graba tu voz para que el estudiante escuche la instrucción o pregunta, añade imágenes y elige entre las 11 mecánicas.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePreviewForm}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#EE7C6A]/10 text-[#EE7C6A] hover:bg-[#EE7C6A]/20 rounded-full text-xs font-extrabold transition"
              >
                <Eye className="w-3.5 h-3.5" /> Vista previa
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  if (onCerrarEdicionExterna) onCerrarEdicionExterna();
                }}
                className="px-4 py-2 bg-[#F5F2EC] hover:bg-[#EBE8E0] rounded-full text-xs font-bold text-[#57534E]"
              >
                Cancelar
              </button>
            </div>
          </div>

          <form onSubmit={handleGuardar} className="space-y-6">
            {/* Datos Generales de la Actividad */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#78716C] uppercase mb-1.5">
                  Título de la actividad
                </label>
                <input
                  type="text"
                  placeholder="Ej: Etapa 2 · El sonido que viaja a mi cerebro"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#EFECE6] rounded-2xl text-sm bg-[#FBF9F5] text-[#1C1917]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#78716C] uppercase mb-1.5">
                  Destino de la actividad
                </label>
                <select
                  value={etapaAsignadaId}
                  onChange={(e) => setEtapaAsignadaId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#EFECE6] rounded-2xl text-xs font-bold bg-[#FBF9F5] text-[#1C1917]"
                >
                  <option value="">📚 Guardar como Plantilla en el Banco</option>
                  {etapas.map((et) => (
                    <option key={et.id} value={et.id}>
                      🗺️ Añadir a Ruta: {et.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Video científico opcional y switches de accesibilidad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#FBF9F5] border border-[#EFECE6]">
              <div>
                <label className="block text-xs font-bold text-[#78716C] uppercase mb-1">
                  🎬 Video de apoyo para el Atelier (Opcional)
                </label>
                <select
                  value={videoUrlActividad}
                  onChange={(e) => setVideoUrlActividad(e.target.value)}
                  className="w-full px-3 py-2 border border-[#EFECE6] rounded-xl text-xs bg-white text-[#1C1917] font-semibold"
                >
                  <option value="">Sin video (usar imagen de portada)</option>
                  <option value="/multimedia/Brain_lobes_with_neural_pulses_202608082048.mp4">
                    🧠 Cerebro 3D con pulsos neuronales
                  </option>
                  <option value="/multimedia/Human_eye_pupil_reacting_202608082048.mp4">
                    👁️ Pupila del ojo humano reaccionando a la luz
                  </option>
                  <option value="/multimedia/Polar_bear_walking_on_ice_202608082048.mp4">
                    🐻‍❄️ Oso polar caminando en el hielo ártico
                  </option>
                  <option value="/multimedia/Human_heart_beating_rhythmically_202608082048.mp4">
                    💓 Corazón humano latiendo rítmicamente
                  </option>
                </select>
              </div>

              <div className="flex flex-col justify-center space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-[#1C1917]">
                  <input
                    type="checkbox"
                    checked={mostrarFelicitacion}
                    onChange={(e) => setMostrarFelicitacion(e.target.checked)}
                    className="w-4 h-4 accent-[#EE7C6A] rounded"
                  />
                  Refuerzo positivo al terminar (Celebración)
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-[#1C1917]">
                  <input
                    type="checkbox"
                    checked={vozSintetica}
                    onChange={(e) => setVozSintetica(e.target.checked)}
                    className="w-4 h-4 accent-[#EE7C6A] rounded"
                  />
                  Síntesis de voz automática (TTS si no hay audio grabado)
                </label>
              </div>
            </div>

            {/* Barra de preguntas múltiples */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-[#F5F2EC] p-3 rounded-2xl border border-[#EFECE6]">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-extrabold uppercase text-[#78716C] mr-1">Preguntas:</span>
                {Math.max(preguntasGuardadas.length, 1) > 0 &&
                  Array.from({ length: Math.max(preguntasGuardadas.length, 1) }).map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => cambiarPreguntaActiva(idx)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition ${
                        preguntaActivaIdx === idx
                          ? 'bg-[#EE7C6A] text-white shadow-sm'
                          : 'bg-white text-[#57534E] border border-[#EFECE6] hover:border-[#EE7C6A]'
                      }`}
                    >
                      Pregunta {idx + 1}
                    </button>
                  ))}
                <button
                  type="button"
                  onClick={anadirNuevaPregunta}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#10B981] hover:bg-[#0EA371] text-white text-xs font-bold transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Añadir otra pregunta
                </button>
              </div>

              {preguntasGuardadas.length > 1 && (
                <button
                  type="button"
                  onClick={eliminarPreguntaActual}
                  className="flex items-center gap-1 text-xs font-bold text-[#D9363E] hover:underline"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Quitar pregunta {preguntaActivaIdx + 1}
                </button>
              )}
            </div>

            {/* CONFIGURACIÓN DE LA PREGUNTA ACTIVA */}
            <div className="p-5 border-2 border-[#EFECE6] rounded-2xl space-y-5 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#78716C] uppercase mb-1.5">
                    Mecánica de la Pregunta {preguntaActivaIdx + 1} (11 formatos disponibles)
                  </label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as ActividadTipo)}
                    className="w-full px-3.5 py-2.5 border border-[#EFECE6] rounded-xl text-sm bg-[#FBF9F5] text-[#1C1917] font-bold"
                  >
                    <option value="seleccion">✅ Selección Múltiple</option>
                    <option value="escuchar_responder">🎧 Escuchar Audio y Responder</option>
                    <option value="emparejar">🔗 Unir Parejas (Columna A ↔ B)</option>
                    <option value="clasificar">🗂️ Clasificar en Cajones</option>
                    <option value="ordenar">🔢 Ordenar Secuencia Paso a Paso</option>
                    <option value="memoria">🃏 Juego de Memoria (Voltear Cartas)</option>
                    <option value="identificar">🔍 Identificar en Cuadrícula Visual</option>
                    <option value="completar">🧩 Completar la Oración con Huecos</option>
                    <option value="trazar_colorear">🎨 Trazar y Colorear en Lienzo</option>
                    <option value="reconocer_emociones">😊 Reconocer Emociones</option>
                    <option value="autoevaluacion">🌟 Autoevaluación (Tablero de Sonrisas)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#78716C] uppercase mb-1.5">
                    Instrucción o Enunciado para el estudiante
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Escucha el audio grabado y elige la respuesta correcta..."
                    value={instruccion}
                    onChange={(e) => setInstruccion(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-[#EFECE6] rounded-xl text-sm bg-[#FBF9F5] text-[#1C1917]"
                    required
                  />
                </div>
              </div>

              {/* GRABADOR DE VOZ INTEGRADO PARA QUE EL ESTUDIANTE ESCUCHE AL PROFESOR */}
              <GrabadorVoz
                label="🎙️ Grabar audio de instrucción con tu voz (o elegir sonido para que el estudiante escuche)"
                currentAudioUrl={audioUrl}
                onSave={(blobOrFile) => handleGuardarAudioGrabado(blobOrFile, false)}
                onSelectUrl={(url) => setAudioUrl(url)}
              />

              {/* SUBIDOR Y GALERÍA DE IMAGEN DE SOPORTE */}
              <SubeImagen
                label="🖼️ Imagen de soporte de la pregunta (Subir foto, elegir de galería o pegar URL)"
                previewUrl={imagenUrl}
                onImageSelected={handleSeleccionarImagen}
              />

              {/* SUB-FORMULARIOS SEGÚN EL TIPO DE PREGUNTA */}
              <div className="border-t border-[#EFECE6] pt-5">
                {/* 1 y 2. SELECCIÓN MÚLTIPLE Y ESCUCHAR_RESPONDER */}
                {(tipo === 'seleccion' || tipo === 'escuchar_responder') && (
                  <div className="space-y-4">
                    {tipo === 'escuchar_responder' && (
                      <GrabadorVoz
                        label="🔊 Audio principal del reto «Escuchar y Responder» (Graba el sonido/pregunta o elige uno del aula)"
                        currentAudioUrl={audioPreguntaUrl}
                        onSave={(blobOrFile) => handleGuardarAudioGrabado(blobOrFile, true)}
                        onSelectUrl={(url) => setAudioPreguntaUrl(url)}
                      />
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#EE7C6A] uppercase">
                        Opciones de Respuesta ({opcionesSeleccion.length})
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setOpcionesSeleccion([...opcionesSeleccion, { texto: '', esCorrecta: false, imagenUrl: '' }])
                        }
                        className="text-xs font-bold text-[#10B981] hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Añadir opción
                      </button>
                    </div>

                    {opcionesSeleccion.map((op, idx) => (
                      <div key={idx} className="flex flex-wrap items-center gap-2 bg-[#FBF9F5] p-3 rounded-xl border border-[#EFECE6]">
                        <input
                          type="text"
                          placeholder={`Texto de la opción ${idx + 1}`}
                          value={op.texto}
                          onChange={(e) => {
                            const val = [...opcionesSeleccion];
                            val[idx].texto = e.target.value;
                            setOpcionesSeleccion(val);
                          }}
                          className="flex-1 min-w-[200px] px-3 py-2 border border-[#EFECE6] rounded-xl text-sm bg-white text-[#1C1917]"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Imagen URL opcional (/multimedia/img/...)"
                          value={op.imagenUrl || ''}
                          onChange={(e) => {
                            const val = [...opcionesSeleccion];
                            val[idx].imagenUrl = e.target.value;
                            setOpcionesSeleccion(val);
                          }}
                          className="w-56 px-3 py-2 border border-[#EFECE6] rounded-xl text-xs bg-white text-[#78716C]"
                        />
                        <label className="flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-lg bg-white border border-[#EFECE6]">
                          <input
                            type="radio"
                            name="correct_radio"
                            checked={op.esCorrecta}
                            onChange={() => {
                              const val = opcionesSeleccion.map((o, i) => ({ ...o, esCorrecta: i === idx }));
                              setOpcionesSeleccion(val);
                            }}
                          />
                          Correcta
                        </label>
                        {opcionesSeleccion.length > 2 && (
                          <button
                            type="button"
                            onClick={() => setOpcionesSeleccion(opcionesSeleccion.filter((_, i) => i !== idx))}
                            className="p-1.5 text-[#A8A29E] hover:text-[#D9363E]"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. EMPAREJAR */}
                {tipo === 'emparejar' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#EE7C6A] uppercase">
                        Parejas a Unir (Texto o ruta de imagen /multimedia/img/...)
                      </span>
                      <button
                        type="button"
                        onClick={() => setParejasEmparejar([...parejasEmparejar, { origen: '', destino: '' }])}
                        className="text-xs font-bold text-[#10B981] hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Añadir pareja
                      </button>
                    </div>
                    {parejasEmparejar.map((p, idx) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder={`Columna A (${idx + 1}): texto o /multimedia/img/ojo.jpg`}
                          value={p.origen}
                          onChange={(e) => {
                            const val = [...parejasEmparejar];
                            val[idx].origen = e.target.value;
                            setParejasEmparejar(val);
                          }}
                          className="px-3 py-2 border border-[#EFECE6] rounded-xl text-sm bg-[#FBF9F5] text-[#1C1917]"
                          required
                        />
                        <input
                          type="text"
                          placeholder={`Columna B (${idx + 1}): pareja correspondiente`}
                          value={p.destino}
                          onChange={(e) => {
                            const val = [...parejasEmparejar];
                            val[idx].destino = e.target.value;
                            setParejasEmparejar(val);
                          }}
                          className="px-3 py-2 border border-[#EFECE6] rounded-xl text-sm bg-[#FBF9F5] text-[#1C1917]"
                          required
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* 4. CLASIFICAR */}
                {tipo === 'clasificar' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <span className="block text-xs font-bold text-[#EE7C6A] uppercase">Cajones (Categorías)</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {categoriasClasificar.map((cat, idx) => (
                          <input
                            key={idx}
                            type="text"
                            placeholder={`Nombre del Cajón ${idx + 1}`}
                            value={cat}
                            onChange={(e) => {
                              const val = [...categoriasClasificar];
                              val[idx] = e.target.value;
                              setCategoriasClasificar(val);
                            }}
                            className="px-3 py-2 border border-[#EFECE6] rounded-xl text-sm bg-[#FBF9F5] text-[#1C1917]"
                            required
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-[#EFECE6] pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#EE7C6A] uppercase">Elementos a Clasificar</span>
                        <button
                          type="button"
                          onClick={() =>
                            setElementosClasificar([...elementosClasificar, { texto: '', categoriaIndex: 0 }])
                          }
                          className="text-xs font-bold text-[#10B981] hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Añadir elemento
                        </button>
                      </div>
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
                            className="flex-1 px-3 py-2 border border-[#EFECE6] rounded-xl text-sm bg-[#FBF9F5] text-[#1C1917]"
                            required
                          />
                          <select
                            value={el.categoriaIndex}
                            onChange={(e) => {
                              const val = [...elementosClasificar];
                              val[idx].categoriaIndex = parseInt(e.target.value) || 0;
                              setElementosClasificar(val);
                            }}
                            className="px-3 py-2 border border-[#EFECE6] rounded-xl text-xs bg-white text-[#1C1917] font-bold"
                          >
                            {categoriasClasificar.map((cat, cIdx) => (
                              <option key={cIdx} value={cIdx}>
                                {cat || `Cajón ${cIdx + 1}`}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. ORDENAR SECUENCIA */}
                {tipo === 'ordenar' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#EE7C6A] uppercase">
                        Pasos en el orden correcto (El sistema los desordenará automáticamente al jugar)
                      </span>
                      <button
                        type="button"
                        onClick={() => setPasosOrdenar([...pasosOrdenar, ''])}
                        className="text-xs font-bold text-[#10B981] hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Añadir paso
                      </button>
                    </div>
                    {pasosOrdenar.map((pasoTxt, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-[#EE7C6A] text-white font-black text-xs flex items-center justify-center shrink-0">
                          {idx + 1}°
                        </span>
                        <input
                          type="text"
                          placeholder={`Describe el paso ${idx + 1}° de la secuencia...`}
                          value={pasoTxt}
                          onChange={(e) => {
                            const copia = [...pasosOrdenar];
                            copia[idx] = e.target.value;
                            setPasosOrdenar(copia);
                          }}
                          className="flex-1 px-3 py-2 border border-[#EFECE6] rounded-xl text-sm bg-[#FBF9F5] text-[#1C1917]"
                          required
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* 6. MEMORIA */}
                {tipo === 'memoria' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#EE7C6A] uppercase">
                        Parejas de Cartas para el Tablero de Memoria (Texto o URL de imagen)
                      </span>
                      <button
                        type="button"
                        onClick={() => setParejasMemoria([...parejasMemoria, { cartaA: '', cartaB: '' }])}
                        className="text-xs font-bold text-[#10B981] hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Añadir pareja de cartas
                      </button>
                    </div>
                    {parejasMemoria.map((par, idx) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder={`Carta A (Pareja ${idx + 1}): texto o /multimedia/img/...`}
                          value={par.cartaA}
                          onChange={(e) => {
                            const copia = [...parejasMemoria];
                            copia[idx].cartaA = e.target.value;
                            setParejasMemoria(copia);
                          }}
                          className="px-3 py-2 border border-[#EFECE6] rounded-xl text-sm bg-[#FBF9F5] text-[#1C1917]"
                          required
                        />
                        <input
                          type="text"
                          placeholder={`Carta B (Pareja ${idx + 1}): texto o /multimedia/img/...`}
                          value={par.cartaB}
                          onChange={(e) => {
                            const copia = [...parejasMemoria];
                            copia[idx].cartaB = e.target.value;
                            setParejasMemoria(copia);
                          }}
                          className="px-3 py-2 border border-[#EFECE6] rounded-xl text-sm bg-[#FBF9F5] text-[#1C1917]"
                          required
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* 7. IDENTIFICAR */}
                {tipo === 'identificar' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#EE7C6A] uppercase">
                        Tarjetas Visuales (Marca cuáles debe seleccionar el estudiante)
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setElementosIdentificar([
                            ...elementosIdentificar,
                            { nombre: '', imagenUrl: '/multimedia/img/oso_polar.jpg', esCorrecto: false }
                          ])
                        }
                        className="text-xs font-bold text-[#10B981] hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Añadir tarjeta
                      </button>
                    </div>
                    {elementosIdentificar.map((el, idx) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center bg-[#FBF9F5] p-3 rounded-xl border border-[#EFECE6]">
                        <input
                          type="text"
                          placeholder={`Nombre o descripción ${idx + 1}`}
                          value={el.nombre}
                          onChange={(e) => {
                            const copia = [...elementosIdentificar];
                            copia[idx].nombre = e.target.value;
                            setElementosIdentificar(copia);
                          }}
                          className="px-3 py-2 border border-[#EFECE6] rounded-xl text-sm bg-white text-[#1C1917]"
                          required
                        />
                        <input
                          type="text"
                          placeholder="URL Imagen (/multimedia/img/...)"
                          value={el.imagenUrl}
                          onChange={(e) => {
                            const copia = [...elementosIdentificar];
                            copia[idx].imagenUrl = e.target.value;
                            setElementosIdentificar(copia);
                          }}
                          className="px-3 py-2 border border-[#EFECE6] rounded-xl text-xs bg-white text-[#1C1917]"
                          required
                        />
                        <label className="flex items-center gap-2 text-xs font-bold text-[#1C1917]">
                          <input
                            type="checkbox"
                            checked={el.esCorrecto}
                            onChange={(e) => {
                              const copia = [...elementosIdentificar];
                              copia[idx].esCorrecto = e.target.checked;
                              setElementosIdentificar(copia);
                            }}
                            className="w-4 h-4 accent-[#10B981]"
                          />
                          ¿Debe seleccionarla?
                        </label>
                      </div>
                    ))}
                  </div>
                )}

                {/* 8. COMPLETAR */}
                {tipo === 'completar' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#EE7C6A] uppercase mb-1">
                        Oración con huecos entre corchetes [ ]
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Los [sentidos] envían información por los [nervios] hasta el [cerebro]."
                        value={oracionCompletar}
                        onChange={(e) => setOracionCompletar(e.target.value)}
                        className="w-full px-3 py-2.5 border border-[#EFECE6] rounded-xl text-sm bg-[#FBF9F5] text-[#1C1917] font-mono"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <span className="block text-xs font-bold text-[#78716C] uppercase">
                        Palabras distractoras adicionales (las palabras entre [ ] se incluyen automáticamente)
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {opcionesCompletar.map((op, idx) => (
                          <input
                            key={idx}
                            type="text"
                            placeholder={`Distractor ${idx + 1}`}
                            value={op}
                            onChange={(e) => {
                              const val = [...opcionesCompletar];
                              val[idx] = e.target.value;
                              setOpcionesCompletar(val);
                            }}
                            className="px-3 py-2 border border-[#EFECE6] rounded-xl text-xs bg-[#FBF9F5] text-[#1C1917]"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 9. TRAZAR O COLOREAR */}
                {tipo === 'trazar_colorear' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#EE7C6A] uppercase mb-1">
                        Imagen de fondo para el lienzo
                      </label>
                      <input
                        type="text"
                        value={lienzoFondoUrl}
                        onChange={(e) => setLienzoFondoUrl(e.target.value)}
                        placeholder="/multimedia/img/cuerpo_cerebro.jpg"
                        className="w-full px-3 py-2 border border-[#EFECE6] rounded-xl text-xs bg-[#FBF9F5] text-[#1C1917]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#EE7C6A] uppercase mb-1">
                        Color inicial sugerido
                      </label>
                      <input
                        type="color"
                        value={colorSugerido}
                        onChange={(e) => setColorSugerido(e.target.value)}
                        className="h-10 w-24 rounded-xl border border-[#EFECE6] cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* 10. RECONOCER EMOCIONES */}
                {tipo === 'reconocer_emociones' && (
                  <div className="space-y-3">
                    <span className="block text-xs font-bold text-[#EE7C6A] uppercase">Reconocimiento Emocional</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[#78716C] mb-1">Imagen de Rostro o Emoción</label>
                        <input
                          type="text"
                          value={rostroUrl}
                          onChange={(e) => setRostroUrl(e.target.value)}
                          className="w-full px-3 py-2 border border-[#EFECE6] rounded-xl text-xs bg-[#FBF9F5] text-[#1C1917]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#78716C] mb-1">Emoción Correcta</label>
                        <input
                          type="text"
                          value={emocionCorrecta}
                          onChange={(e) => setEmocionCorrecta(e.target.value)}
                          className="w-full px-3 py-2 border border-[#EFECE6] rounded-xl text-xs bg-[#FBF9F5] text-[#1C1917] font-bold"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 11. AUTOEVALUACIÓN */}
                {tipo === 'autoevaluacion' && (
                  <div className="space-y-3">
                    <span className="block text-xs font-bold text-[#EE7C6A] uppercase">Tablero de Sonrisas Logradas</span>
                    <div>
                      <label className="block text-xs font-bold text-[#78716C] mb-1">Frase de logro o reflexión</label>
                      <input
                        type="text"
                        placeholder="Ej: ¡Logré usar mi tablet y mis videos de sonidos para aprender en biología!"
                        value={reflexionAutoeval}
                        onChange={(e) => setReflexionAutoeval(e.target.value)}
                        className="w-full px-3 py-2 border border-[#EFECE6] rounded-xl text-xs bg-[#FBF9F5] text-[#1C1917]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {msg.error && <p className="text-xs font-bold text-[#D9363E] bg-[#FFF2F0] p-3 rounded-xl">{msg.error}</p>}
            {msg.success && <p className="text-xs font-bold text-[#10B981] bg-[#ECFDF5] p-3 rounded-xl">{msg.success}</p>}

            <button
              type="submit"
              className="w-full py-3.5 bg-[#EE7C6A] hover:bg-[#E46653] text-white font-extrabold rounded-2xl text-sm transition shadow-md flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              {editingId ? 'Guardar Cambios de la Actividad' : 'Crear Actividad Adaptada'}
            </button>
          </form>
        </div>
      )}

      {/* PREVIEW OVERLAY */}
      {previewActividad && (
        <div className="fixed inset-0 z-50 bg-[#FBF9F5] flex flex-col overflow-auto">
          <div className="sticky top-0 z-50 bg-white/90 border-b border-[#EFECE6] px-6 py-3 flex items-center justify-between shadow-sm backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="font-serif-atelier font-bold text-lg text-[#1C1917]">ECO INCLUSIVO✦</span>
              <span className="text-xs bg-[#EE7C6A]/10 text-[#EE7C6A] px-2.5 py-0.5 rounded-full font-bold">
                Vista Previa Profesor
              </span>
            </div>
            <button
              onClick={() => setPreviewActividad(null)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#F5F2EC] hover:bg-[#EBE8E0] text-[#57534E] rounded-full text-xs font-bold transition"
            >
              <X className="w-4 h-4" /> Cerrar Vista Previa
            </button>
          </div>

          <div className="flex-1">
            <ReproductorEnfocado
              actividad={previewActividad}
              estudianteId="preview"
              pasoActual={1}
              totalPasos={1}
              onCompletado={() => setPreviewActividad(null)}
              onVolver={() => setPreviewActividad(null)}
              modoPreview={true}
            />
          </div>
        </div>
      )}

      {/* MODAL: RECICLAR PLANTILLA A UNA RUTA */}
      {reciclandoActividad && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[24px] border border-[#EFECE6] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif-atelier font-bold text-lg text-[#1C1917] flex items-center gap-2">
                <Recycle className="w-5 h-5 text-[#10B981]" /> Usar en una ruta
              </h3>
              <button
                type="button"
                onClick={() => setReciclandoActividad(null)}
                className="p-1 text-[#78716C] hover:text-[#1C1917]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#78716C]">
              Se copiará <b className="text-[#1C1917]">«{reciclandoActividad.titulo}»</b> como último paso de la ruta elegida.
            </p>

            <div>
              <label className="block text-xs font-bold text-[#78716C] uppercase mb-1.5">Ruta destino</label>
              <select
                value={rutaDestinoId}
                onChange={(e) => setRutaDestinoId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[#EFECE6] rounded-2xl text-xs bg-[#FBF9F5] text-[#1C1917] focus:outline-none focus:border-[#EE7C6A]"
              >
                <option value="">Selecciona una ruta</option>
                {etapas.map((et) => (
                  <option key={et.id} value={et.id}>
                    {et.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReciclandoActividad(null)}
                className="px-4 py-2 text-xs font-bold text-[#78716C] hover:text-[#1C1917]"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!rutaDestinoId}
                onClick={confirmarReciclaje}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-[#10B981] hover:bg-[#0EA371] text-white font-bold text-xs rounded-2xl transition disabled:opacity-40"
              >
                Añadir a la ruta <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
