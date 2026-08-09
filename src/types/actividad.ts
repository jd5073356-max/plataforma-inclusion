export type ActividadTipo =
  | 'emparejar'
  | 'seleccion'
  | 'identificar'
  | 'clasificar'
  | 'escuchar_responder'
  | 'ordenar'
  | 'completar'
  | 'memoria'
  | 'trazar_colorear'
  | 'reconocer_emociones'
  | 'explorador_3d'
  | 'autoevaluacion';

export interface BasePregunta {
  id: string;
  instruccion: string;
  audioUrl?: string; // Grabación de voz del profesor
  imagenUrl?: string; // Imagen complementaria
}

// 1. Emparejar (unir elementos de columna A con columna B)
export interface EmparejarPregunta extends BasePregunta {
  parejas: {
    id: string;
    origen: string; // Texto o URL imagen origen
    origenTipo: 'texto' | 'imagen';
    destino: string; // Texto o URL imagen destino
    destinoTipo: 'texto' | 'imagen';
  }[];
}

// 2. Selección (opción múltiple clásica)
export interface SeleccionPregunta extends BasePregunta {
  opciones: {
    id: string;
    texto: string;
    imagenUrl?: string;
    esCorrecta: boolean;
  }[];
}

// 3. Identificar (señalar un elemento específico en una imagen o lista de elementos)
export interface IdentificarPregunta extends BasePregunta {
  elementos: {
    id: string;
    nombre: string;
    imagenUrl: string;
    esCorrecto: boolean;
  }[];
}

// 4. Clasificar (arrastrar o clickear elementos hacia categorías)
export interface ClasificarPregunta extends BasePregunta {
  categorias: {
    id: string;
    nombre: string;
  }[];
  elementos: {
    id: string;
    texto: string;
    imagenUrl?: string;
    categoriaId: string; // ID de la categoría correcta
  }[];
}

// 5. Escuchar y responder (audio con pregunta y opciones)
export interface EscucharResponderPregunta extends BasePregunta {
  audioPreguntaUrl: string; // Audio obligatorio con la pregunta
  opciones: {
    id: string;
    texto: string;
    imagenUrl?: string;
    esCorrecta: boolean;
  }[];
}

// 6. Ordenar (secuencias lógicas, números, letras o pasos)
export interface OrdenarPregunta extends BasePregunta {
  elementos: {
    id: string;
    texto: string;
    imagenUrl?: string;
    ordenCorrecto: number; // 1, 2, 3...
  }[];
}

// 7. Completar (oraciones con espacios en blanco)
export interface CompletarPregunta extends BasePregunta {
  oracionConHuecos: string; // Ej: "El sol es de color [blanco] y el cielo es [azul]"
  palabrasOpciones: string[]; // Palabras para rellenar
  respuestasCorrectas: { [huecoIndex: number]: string };
}

// 8. Memoria (encontrar parejas de cartas boca abajo)
export interface MemoriaPregunta extends BasePregunta {
  cartas: {
    id: string;
    valor: string; // Texto o imagenUrl
    tipo: 'texto' | 'imagen';
    parejaId: string; // Cartas con el mismo parejaId se emparejan
  }[];
}

// 9. Trazar o Colorear (dibujo sobre lienzo, seguir un trazo o rellenar un color)
export interface TrazarColorearPregunta extends BasePregunta {
  lienzoFondoUrl: string; // Imagen base a colorear o trazar
  puntosDeTrazo?: { x: number; y: number }[]; // Puntos sugeridos si es trazo
  colorSugerido?: string;
}

// 10. Reconocer emociones (seleccionar la emoción de una imagen/historia)
export interface ReconocerEmocionesPregunta extends BasePregunta {
  rostroImagenUrl: string; // Foto o pictograma con emoción
  emocionCorrecta: string; // "alegria", "tristeza", "enojo", etc.
  opciones: {
    id: string;
    emocion: string;
    pictogramaUrl?: string;
  }[];
}

// 11. Explorador 3D (modelo GLB rotable con puntos de interés clicables)
export interface Explorador3DPregunta extends BasePregunta {
  modeloUrl: string; // URL del GLB
  nombreObjeto: string; // Ej: "El corazón"
  puntosDeInteres: {
    id: string;
    nombre: string;
    descripcion: string;
  }[];
  objetivo: string; // Descripción de qué explorar
}

// 12. Autoevaluación (tablero de sonrisas: ¿cómo te sentiste?)
export interface AutoevaluacionPregunta extends BasePregunta {
  escala: {
    id: string;
    etiqueta: string; // "😀 Muy bien"
    emoji: string;
    color: string; // clase tailwind del fondo
  }[];
  reflexion?: string; // Pregunta opcional de reflexión
}

// Unión de todas las preguntas
export type PreguntaConfig =
  | { tipo: 'emparejar'; datos: EmparejarPregunta }
  | { tipo: 'seleccion'; datos: SeleccionPregunta }
  | { tipo: 'identificar'; datos: IdentificarPregunta }
  | { tipo: 'clasificar'; datos: ClasificarPregunta }
  | { tipo: 'escuchar_responder'; datos: EscucharResponderPregunta }
  | { tipo: 'ordenar'; datos: OrdenarPregunta }
  | { tipo: 'completar'; datos: CompletarPregunta }
  | { tipo: 'memoria'; datos: MemoriaPregunta }
  | { tipo: 'trazar_colorear'; datos: TrazarColorearPregunta }
  | { tipo: 'reconocer_emociones'; datos: ReconocerEmocionesPregunta }
  | { tipo: 'explorador_3d'; datos: Explorador3DPregunta }
  | { tipo: 'autoevaluacion'; datos: AutoevaluacionPregunta };

// Configuración general de la actividad
export interface ActividadConfig {
  preguntas: PreguntaConfig[];
  tiempoLimite?: number; // en segundos, opcional
  mostrarFelicitacion: boolean;
  vozSintetica: boolean; // Si no hay audio grabado, usar Web Speech API TTS
}

export interface AtelierDatoClave {
  icono: string;
  etiqueta: string;
  valor: string;
}

export interface AtelierTarjetaRecurso {
  tipo: 'microscopico' | 'comparar' | 'animacion' | 'notas_clinicas' | 'donde_actua';
  etiquetaCategoria: string;
  titulo: string;
  descripcionHtml?: string;
  imagenUrl?: string;
  itemsLista?: string[];
}

export interface AtelierHotspot {
  id: string;
  nombre: string;
  descripcion: string;
  xPercent: number;
  yPercent: number;
}

export interface AtelierConfig {
  subtituloPoetico?: string;
  materia?: string;
  iconoMateria?: string;
  resumenBreve?: string;
  datosClave?: AtelierDatoClave[];
  importanciaEducativa?: string;
  sabiasQue?: string;
  instruccionTip?: string;
  hotspots?: AtelierHotspot[];
  tarjetasRecursos?: AtelierTarjetaRecurso[];
  modelo3DUrl?: string;
}

export interface Actividad {
  id: string;
  profesor_id: string;
  etapa_id?: string;
  tipo: ActividadTipo;
  titulo: string;
  video_url?: string;
  imagen_url?: string;
  configuracion: ActividadConfig;
  atelier?: AtelierConfig;
  creado_en?: string;
}

export interface Perfil {
  id: string;
  rol: 'admin' | 'profesor' | 'estudiante';
  nombre: string;
  curso?: string;
  profesor_id?: string;
  creado_en?: string;
}

export interface Etapa {
  id: string;
  nombre: string;
  orden: number;
  profesor_id: string;
  creado_en?: string;
}

export interface Asignacion {
  id: string;
  estudiante_id: string;
  actividad_id: string;
  ajuste?: 'cognitiva' | 'motriz' | 'tea';
  creado_en?: string;
}

export interface Progreso {
  id: string;
  estudiante_id: string;
  actividad_id: string;
  completado: boolean;
  intentos: number;
  actualizado_en?: string;
}

export interface Recurso {
  id: string;
  profesor_id: string;
  url: string;
  tipo: 'imagen' | 'audio';
  creado_en?: string;
}
