import React, { useState } from 'react';
import { 
  Compass, BookOpen, Bookmark, Search, ChevronDown, Heart, Sparkles, 
  ArrowRight, Stethoscope, Play, HelpCircle, Share2, Microscope, 
  FileText, Activity as ActivityIcon, Layers, CheckCircle2, ArrowLeft, Home, User
} from 'lucide-react';
import { Actividad, AtelierDatoClave, AtelierTarjetaRecurso, AtelierHotspot } from '../../types/actividad';
import Visor3DAtelier from './Visor3DAtelier';
import ReproductorActividad from '../reproductor/ReproductorActividad';

interface AtelierExploradorProps {
  actividadActual: Actividad;
  listaActividades?: Actividad[];
  onSeleccionarActividad?: (actividad: Actividad) => void;
  estudianteId?: string;
  ajuste?: 'cognitiva' | 'motriz' | 'tea';
  onCompletado?: () => void;
  modoPreview?: boolean;
}

export const AtelierExplorador: React.FC<AtelierExploradorProps> = ({
  actividadActual,
  listaActividades = [],
  onSeleccionarActividad,
  estudianteId = 'preview',
  ajuste,
  onCompletado,
  modoPreview = false
}) => {
  const [seccionTab, setSeccionTab] = useState<'explorar' | 'guias' | 'coleccion' | 'notas'>('explorar');
  const [mostrandoQuizModal, setMostrandoQuizModal] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [actividadSeleccionada, setActividadSeleccionada] = useState<Actividad>(actividadActual);
  const [hotspotDestacado, setHotspotDestacado] = useState<AtelierHotspot | null>(null);

  // Extraer configuración enriquecida o usar defaults con estilo Atelier
  const configAtelier = actividadSeleccionada.atelier || {};

  const subtituloPoetico = configAtelier.subtituloPoetico || 'Unidad de aprendizaje inmersiva';
  const materia = configAtelier.materia || 'Ciencias & Inclusión';
  const resumenBreve = configAtelier.resumenBreve || 
    'Unidad didáctica interactiva diseñada para indagar, observar y comprender conceptos fundamentales de forma inmersiva.';
  
  const datosClave: AtelierDatoClave[] = configAtelier.datosClave || [
    { icono: '◇', etiqueta: 'Estructura', valor: 'Anatomía / Componente Didáctico' },
    { icono: '♙', etiqueta: 'Nivel PIAR', valor: 'Adaptación Curricular 2026' },
    { icono: '⌁', etiqueta: 'Frecuencia', valor: 'Interacción Multi-sensorial' },
    { icono: '⌖', etiqueta: 'Ubicación', valor: 'Módulo Principal de Exploración' },
    { icono: '❋', etiqueta: 'Recursos', valor: 'Visuales, Audios y 3D' },
    { icono: '◈', etiqueta: 'Función', valor: 'Desarrollo de Competencias Clave' }
  ];

  const importancia = configAtelier.importanciaEducativa || 
    'Permite comprender el funcionamiento real del concepto mediante la observación activa y la experimentación gráfica.';
  
  const sabiasQue = configAtelier.sabiasQue || 
    'El aprendizaje visual y táctil fortalece la memoria a largo plazo en más de un 75% según guías neuroeducativas.';

  const hotspots: AtelierHotspot[] = configAtelier.hotspots || [
    { id: 'h1', nombre: 'Región Principal', descripcion: 'Foco central de interacción y observación.', xPercent: 48, yPercent: 42 },
    { id: 'h2', nombre: 'Conexión Superior', descripcion: 'Vínculo funcional con los sistemas circundantes.', xPercent: 32, yPercent: 28 },
    { id: 'h3', nombre: 'Base Estructural', descripcion: 'Soporte y estabilidad del elemento.', xPercent: 56, yPercent: 68 }
  ];

  const tarjetasRecursos: AtelierTarjetaRecurso[] = configAtelier.tarjetasRecursos || [
    {
      tipo: 'microscopico',
      etiquetaCategoria: 'Vista microscópica',
      titulo: 'Estructura interna en detalle',
      descripcionHtml: 'Análisis macro y micro de los componentes esenciales.',
      imagenUrl: 'https://images.unsplash.com/photo-1530210124550-912dc1381cb8?auto=format&fit=crop&w=600&q=80'
    },
    {
      tipo: 'comparar',
      etiquetaCategoria: 'Comparativa didáctica',
      titulo: 'Relaciones y proporciones',
      descripcionHtml: 'Comparación directa frente a elementos similares del entorno.',
      imagenUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80'
    },
    {
      tipo: 'animacion',
      etiquetaCategoria: 'Función dinámica',
      titulo: 'Dinámica de funcionamiento',
      descripcionHtml: 'Visualización interactiva del proceso en tiempo real.',
      imagenUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=600&q=80'
    },
    {
      tipo: 'notas_clinicas',
      etiquetaCategoria: 'Aplicación práctica',
      titulo: 'Casos y usos reales',
      itemsLista: [
        'Uso cotidiano en el aula',
        'Reconocimiento de patrones',
        'Autorregulación y hábitos',
        'Autonomía en la vida diaria'
      ]
    },
    {
      tipo: 'donde_actua',
      etiquetaCategoria: 'Contexto general',
      titulo: 'Dónde actúa en el entorno',
      imagenUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=600&q=80'
    }
  ];

  // Filtrar lista de actividades si hay búsqueda
  const actividadesFiltradas = listaActividades.length > 0 ? listaActividades.filter(a => 
    a.titulo.toLowerCase().includes(busqueda.toLowerCase())
  ) : [actividadSeleccionada];

  return (
    <div className="atelier-shell flex flex-col min-h-screen text-[#1C1917] bg-[#FBF9F5]">
      {/* 1. TOPBAR NAVEGACIÓN ATELIER */}
      <header className="sticky top-0 z-40 bg-[#FBF9F5]/90 backdrop-blur-md border-b border-[#EFECE6] px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Marca Atelier */}
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={() => setActividadSeleccionada(actividadActual)}
            className="flex flex-col text-left group"
          >
            <div className="flex items-center gap-1.5 font-serif-atelier text-2xl font-bold tracking-tight text-[#1C1917]">
              <span>ECO INCLUSIVO</span>
              <span className="text-[#EE7C6A] text-xs align-super">✦</span>
            </div>
            <span className="text-[11px] font-sans-atelier italic text-[#78716C]">
              Aprender con curiosidad e inclusión
            </span>
          </button>
        </div>

        {/* Naves de navegación primaria */}
        <nav className="hidden md:flex items-center gap-1 bg-[#F5F2EC] p-1 rounded-full border border-[#EBE8E0]">
          <button
            onClick={() => setSeccionTab('explorar')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition ${
              seccionTab === 'explorar' 
                ? 'bg-white text-[#1C1917] shadow-sm' 
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            <Compass className="w-4 h-4 text-[#EE7C6A]" />
            Explorar
          </button>

          <button
            onClick={() => setSeccionTab('guias')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition ${
              seccionTab === 'guias' 
                ? 'bg-white text-[#1C1917] shadow-sm' 
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            <BookOpen className="w-4 h-4 text-[#7294B9]" />
            Guías PIAR
          </button>

          <button
            onClick={() => setSeccionTab('coleccion')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition ${
              seccionTab === 'coleccion' 
                ? 'bg-white text-[#1C1917] shadow-sm' 
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            <Bookmark className="w-4 h-4 text-[#F59E0B]" />
            Biblioteca
          </button>
        </nav>

        {/* Buscador & Perfil */}
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A29E]" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar temas, guías..."
              className="w-full bg-[#F5F2EC] border border-[#EBE8E0] focus:border-[#EE7C6A] rounded-full pl-9 pr-4 py-1.5 text-xs text-[#1C1917] placeholder-[#A8A29E] focus:outline-none transition"
            />
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-[#EFECE6] shadow-sm">
            <div className="w-7 h-7 rounded-full bg-[#EE7C6A]/15 text-[#EE7C6A] flex items-center justify-center font-bold text-xs">
              EI
            </div>
            <span className="text-xs font-bold text-[#1C1917] hidden md:inline">Estudiante</span>
          </div>
        </div>
      </header>

      {/* 2. WORKSPACE MAESTRO (LAYOUT DE 3 COLUMNAS) */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUMNA IZQUIERDA: BIBLIOTECA / CATÁLOGO (3 Cols en LG) */}
        <aside className="lg:col-span-3 flex flex-col gap-4">
          <div className="atelier-card p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-[#F5F2EC] pb-3">
              <span className="font-serif-atelier text-lg font-bold text-[#1C1917]">Biblioteca Didáctica</span>
              <Bookmark className="w-4 h-4 text-[#EE7C6A]" />
            </div>

            {/* Lista de ítems/actividades */}
            <div className="flex flex-col gap-2 max-h-[480px] overflow-y-auto pr-1">
              {actividadesFiltradas.map((act) => {
                const esActiva = act.id === actividadSeleccionada.id;
                return (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => {
                      setActividadSeleccionada(act);
                      onSeleccionarActividad?.(act);
                    }}
                    className={`w-full p-3 rounded-2xl text-left transition flex items-center gap-3 border ${
                      esActiva
                        ? 'bg-[#EE7C6A]/10 border-[#EE7C6A] shadow-sm'
                        : 'bg-white hover:bg-[#FBF9F5] border-[#EFECE6]'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      esActiva ? 'bg-[#EE7C6A] text-white' : 'bg-[#F5F2EC] text-[#57534E]'
                    }`}>
                      {act.titulo.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-[#1C1917] truncate">{act.titulo}</h4>
                      <p className="text-[11px] text-[#78716C] capitalize truncate">{act.tipo.replace('_', ' ')}</p>
                    </div>
                    <Heart className={`w-4 h-4 ${esActiva ? 'text-[#EE7C6A] fill-[#EE7C6A]' : 'text-[#D6D3D1]'}`} />
                  </button>
                );
              })}
            </div>

            <button className="w-full py-2.5 bg-[#F5F2EC] hover:bg-[#EBE8E0] text-[#57534E] text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 mt-1">
              <span>Ver todas las actividades</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Cita de curiosidad */}
          <div className="atelier-tip-note p-4 text-xs text-[#78350F] flex flex-col gap-2">
            <div className="flex items-center gap-2 font-bold text-[#92400E]">
              <Sparkles className="w-4 h-4 text-[#F59E0B]" />
              <span>Espíritu Atelier</span>
            </div>
            <p className="italic font-serif-atelier text-base leading-snug">
              "El aprendizaje es un acto de curiosidad y exploración."
            </p>
            <span className="text-[10px] uppercase tracking-wider text-[#B45309] font-bold">
              ¡Sigue investigando!
            </span>
          </div>
        </aside>

        {/* COLUMNA CENTRAL: VIEWPORT PRINCIPAL CON VISOR 3D (5 Cols en LG) */}
        <section className="lg:col-span-5 flex flex-col gap-4 min-h-[520px]">
          <div className="atelier-card p-2 flex-1 relative min-h-[500px]">
            <Visor3DAtelier
              modeloUrl={configAtelier.modelo3DUrl}
              nombreObjeto={actividadSeleccionada.titulo}
              subtitulo={subtituloPoetico}
              hotspots={hotspots}
              instruccionTip={configAtelier.instruccionTip || 'Arrastra para rotar · Haz clic en los puntos'}
              onSelectHotspot={(hp) => setHotspotDestacado(hp)}
            />
          </div>
        </section>

        {/* COLUMNA DERECHA: FICHA INMERSIVA DIDÁCTICA (4 Cols en LG) */}
        <aside className="lg:col-span-4 flex flex-col gap-4">
          <div className="atelier-card p-6 flex flex-col gap-4">
            
            {/* Header del Objeto */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#EE7C6A] mb-1">
                <ActivityIcon className="w-3.5 h-3.5" />
                <span>{materia}</span>
              </div>
              <h1 className="font-serif-atelier text-3xl font-bold text-[#1C1917] leading-tight">
                {actividadSeleccionada.titulo}
              </h1>
              <p className="text-xs italic text-[#78716C] mt-0.5 font-serif-atelier text-base">
                {subtituloPoetico}
              </p>
            </div>

            <p className="text-xs text-[#57534E] leading-relaxed">
              {resumenBreve}
            </p>

            <div className="h-px bg-[#F5F2EC] w-full" />

            {/* KEY FACTS GRID (2 Columnas) */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#A8A29E] mb-3">
                Datos Clave & Especificaciones
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {datosClave.map((item, idx) => (
                  <div key={idx} className="bg-[#FBF9F5] p-2.5 rounded-xl border border-[#F5F2EC]">
                    <span className="text-[#EE7C6A] font-bold mr-1">{item.icono}</span>
                    <span className="text-[#78716C] font-medium">{item.etiqueta}:</span>
                    <p className="font-bold text-[#1C1917] mt-0.5">{item.valor}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Note Box: Importancia Educativa */}
            <div className="bg-[#F0F7FF] border border-[#D0E2FF] p-3.5 rounded-2xl flex items-start gap-3">
              <Stethoscope className="w-5 h-5 text-[#0062FE] shrink-0 mt-0.5" />
              <div className="text-xs text-[#002D9C]">
                <strong className="block font-bold mb-0.5">Importancia Didáctica:</strong>
                {importancia}
              </div>
            </div>

            {/* Note Box: ¿Sabías que...? */}
            <div className="bg-[#FFF8F0] border border-[#FFE8D0] p-3.5 rounded-2xl flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#E65100] shrink-0 mt-0.5" />
              <div className="text-xs text-[#8C2E00]">
                <strong className="block font-bold mb-0.5">¿Sabías que...?</strong>
                {sabiasQue}
              </div>
            </div>

            {/* BOTÓN PRINCIPAL: INICIAR DESAFÍO / QUIZ */}
            <button
              type="button"
              onClick={() => setMostrandoQuizModal(true)}
              className="w-full py-3.5 bg-[#EE7C6A] hover:bg-[#E46653] text-white font-bold text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Iniciar Actividad / Desafío</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* GRID DE ACCIONES SECUNDARIAS */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setMostrandoQuizModal(true)}
                className="py-2 px-3 bg-[#F5F2EC] hover:bg-[#EBE8E0] text-[#57534E] font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 text-[#EE7C6A]" />
                <span>Animar</span>
              </button>

              <button
                type="button"
                onClick={() => setMostrandoQuizModal(true)}
                className="py-2 px-3 bg-[#F5F2EC] hover:bg-[#EBE8E0] text-[#57534E] font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#7294B9]" />
                <span>Quiz</span>
              </button>

              <button
                type="button"
                className="py-2 px-3 bg-[#F5F2EC] hover:bg-[#EBE8E0] text-[#57534E] font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>Comparar</span>
              </button>
            </div>

          </div>
        </aside>
      </main>

      {/* 3. GRID INFERIOR: RECURSOS EXTENDIDOS DE APRENDIZAJE */}
      <section className="max-w-[1600px] w-full mx-auto px-4 md:px-6 pb-12 mt-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#EE7C6A]">Módulos Complementarios</span>
            <h2 className="font-serif-atelier text-2xl font-bold text-[#1C1917]">Recursos de Exploración Profunda</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tarjetasRecursos.map((rec, idx) => (
            <article key={idx} className="atelier-card p-4 flex flex-col justify-between gap-3 group">
              <div>
                <div className="flex items-center justify-between text-[11px] font-bold text-[#78716C] uppercase tracking-wider mb-1">
                  <span>{rec.etiquetaCategoria}</span>
                  <Microscope className="w-4 h-4 text-[#EE7C6A]" />
                </div>
                <h3 className="font-serif-atelier text-lg font-bold text-[#1C1917] group-hover:text-[#EE7C6A] transition">
                  {rec.titulo}
                </h3>
              </div>

              {rec.imagenUrl && (
                <div className="w-full h-32 rounded-xl overflow-hidden bg-[#F5F2EC]">
                  <img 
                    src={rec.imagenUrl} 
                    alt={rec.titulo} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                  />
                </div>
              )}

              {rec.itemsLista && (
                <ul className="text-xs text-[#57534E] space-y-1 py-1">
                  {rec.itemsLista.map((item, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#EE7C6A]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              <button
                type="button"
                onClick={() => setMostrandoQuizModal(true)}
                className="w-full py-2 bg-[#F5F2EC] hover:bg-[#EE7C6A] hover:text-white text-[#57534E] text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <span>Explorar Recurso</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* 4. MODAL DESPLEGABLE CON EL REPRODUCTOR INTERACTIVO DIDÁCTICO */}
      {mostrandoQuizModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 animate-fadeIn">
          <div className="bg-[#FBF9F5] w-full max-w-4xl max-h-[90vh] rounded-[28px] border border-[#EFECE6] shadow-2xl flex flex-col overflow-hidden">
            {/* Header Modal */}
            <div className="bg-white border-b border-[#EFECE6] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#EE7C6A]" />
                <h3 className="font-serif-atelier text-xl font-bold text-[#1C1917]">
                  {actividadSeleccionada.titulo} — Desafío Interactivo
                </h3>
              </div>
              <button
                onClick={() => setMostrandoQuizModal(false)}
                className="px-3 py-1.5 bg-[#F5F2EC] hover:bg-[#EBE8E0] text-[#57534E] font-bold text-xs rounded-xl transition"
              >
                Cerrar
              </button>
            </div>

            {/* Contenido del Reproductor */}
            <div className="flex-1 overflow-y-auto p-4">
              <ReproductorActividad
                actividad={actividadSeleccionada}
                ajuste={ajuste}
                estudianteId={estudianteId}
                onCompletado={() => {
                  setMostrandoQuizModal(false);
                  onCompletado?.();
                }}
                modoPreview={modoPreview}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AtelierExplorador;
