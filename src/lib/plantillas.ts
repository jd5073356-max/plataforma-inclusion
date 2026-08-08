import { Actividad, ActividadTipo, Etapa, PreguntaConfig } from '../types/actividad';

// Assets generados con Higgsfield (CloudFront global). Inventario completo en /tmp/eco-assets/manifest.tsv
export const CLOUDFRONT_BASE = 'https://d8j0ntlcm91z4.cloudfront.net/user_3DkNbs6yI5BmSePfTQoWyNvgVSN/';

export const ASSETS: Record<string, string> = {
  corazon: CLOUDFRONT_BASE + 'hf_20260808_120002_d04d00b9-bd43-4b35-aac7-62b877dd0b69.png',
  cerebro: CLOUDFRONT_BASE + 'hf_20260808_120002_ad30eeb2-0c45-4d1e-82e9-61dc6fcad15d.png',
  pulmones: CLOUDFRONT_BASE + 'hf_20260808_120002_450628b5-ccbb-4713-9913-731056c0ec62.png',
  ojo: CLOUDFRONT_BASE + 'hf_20260808_120002_0476c669-61e8-4d03-9d74-5445648f3dbd.png',
  oreja: CLOUDFRONT_BASE + 'hf_20260808_120002_83db1410-9f4c-48bb-9dc2-5f5a53b465c9.png',
  piel: CLOUDFRONT_BASE + 'hf_20260808_120002_66f52965-c1aa-4cc4-8ba5-7a8dfd5b68a3.png',
  cuerpo_corazon: CLOUDFRONT_BASE + 'hf_20260808_120107_a1ced599-7288-4a72-9ab6-6e3cc0edebe2.png',
  cuerpo_cerebro: CLOUDFRONT_BASE + 'hf_20260808_120151_65a5aeb5-42b7-46eb-94b1-c98372b1284e.png',
  cuerpo_pulmones: CLOUDFRONT_BASE + 'hf_20260808_120107_977a7388-c885-452c-9281-e8e441e081dd.png',
  linterna: CLOUDFRONT_BASE + 'hf_20260808_120107_46512adc-d3c4-4522-af1f-8c5ceb8c29c8.png',
  guitarra: CLOUDFRONT_BASE + 'hf_20260808_120107_8d8c8228-06d8-41b3-bc04-5b6b33dc58bc.png',
  campana: CLOUDFRONT_BASE + 'hf_20260808_120107_394e54c8-c44d-44bb-8015-cb55ab5161f3.png',
  vaso_agua: CLOUDFRONT_BASE + 'hf_20260808_120107_b342de55-e8d2-46ae-bcad-a10c5a789f0f.png',
  tambor: CLOUDFRONT_BASE + 'hf_20260808_120107_c9201f1e-3f24-49d2-96de-c2910eddb993.png',
  flor: CLOUDFRONT_BASE + 'hf_20260808_120107_d1fc814b-3d7a-4a93-aaf8-d94c086de18d.png',
  pluma: CLOUDFRONT_BASE + 'hf_20260808_120107_0ee7c1f2-879e-4455-9346-2b7bfdf02057.png',
  hielo: CLOUDFRONT_BASE + 'hf_20260808_120107_8d183af7-9ff2-4cb5-aaaf-3d42674e7ab9.png',
  manzana: CLOUDFRONT_BASE + 'hf_20260808_120107_c94f21a2-c27d-46f5-8d33-05d187939619.png',
  oso_polar: CLOUDFRONT_BASE + 'hf_20260808_120151_35cc2483-91ce-4116-b9ac-58f2e3221a44.png',
  pinguino: CLOUDFRONT_BASE + 'hf_20260808_120151_6abe35a1-0bb4-47cc-a1c9-ca49d7e0b292.png',
  camello: CLOUDFRONT_BASE + 'hf_20260808_120151_18570db5-c08d-431a-99af-c55703044c7e.png',
  leon: CLOUDFRONT_BASE + 'hf_20260808_120151_31d48f6b-a1f0-46e1-8f8c-e25847a43350.png',
  vaca: CLOUDFRONT_BASE + 'hf_20260808_120152_b0f7745e-8063-4c49-8f61-94065cb9751f.png',
  caballo: CLOUDFRONT_BASE + 'hf_20260808_120151_e19e99c5-4757-4c1b-aa5b-51e5975816ec.png',
  paisaje_polo: CLOUDFRONT_BASE + 'hf_20260808_120151_b14225a7-9f99-4453-a1f4-8120b4fd5eb3.png',
  paisaje_desierto: CLOUDFRONT_BASE + 'hf_20260808_120152_8a1a63fb-5dcb-4d18-8a0e-ababb958d5cd.png',
  paisaje_prado: CLOUDFRONT_BASE + 'hf_20260808_120151_9df6347e-41cd-4626-bafd-f31499b2b176.png',
  paisaje_sabana: CLOUDFRONT_BASE + 'hf_20260808_120151_7f9018ea-f2eb-4696-98e6-713703f46206.png',
  billete_1000: CLOUDFRONT_BASE + 'hf_20260808_121149_5811f86c-3061-4403-9ebc-651373f2567a.png',
  billete_2000: CLOUDFRONT_BASE + 'hf_20260808_121149_1037b108-be59-4c9c-8306-f0873ac99f0b.png',
  billete_5000: CLOUDFRONT_BASE + 'hf_20260808_121149_adbef6f7-1391-4c45-bcd8-c4fba91a71b0.png',
  billete_10000: CLOUDFRONT_BASE + 'hf_20260808_121149_0c9cc121-2220-41f2-8aa0-e5e14f4d76ea.png',
  billete_20000: CLOUDFRONT_BASE + 'hf_20260808_121149_da648e51-8ddc-455e-9053-93123bf1df09.png',
  billete_50000: CLOUDFRONT_BASE + 'hf_20260808_121149_f2dfc799-707f-491b-a422-25e71fb1b0d4.png',
  monedas: CLOUDFRONT_BASE + 'hf_20260808_121149_3e2eb126-9aec-4bb6-89c3-79c64eaeb7fd.png',
  pila_billetes: CLOUDFRONT_BASE + 'hf_20260808_121149_77e2b7c9-6a84-402d-bd26-3c28bb34bda2.png',
  kiosco: CLOUDFRONT_BASE + 'hf_20260808_121150_2f853563-bb3c-4c10-ae2c-bd9339efc6c0.png',
  fruteria: CLOUDFRONT_BASE + 'hf_20260808_121150_084df5b3-c29f-45da-856e-0a3a2ab36d4a.png',
  tangram_cuadrado: CLOUDFRONT_BASE + 'hf_20260808_121248_d7698d45-ccf0-4fe1-8bb5-dd5556321d8a.png',
  tangram_piezas: CLOUDFRONT_BASE + 'hf_20260808_121248_862896f9-5d54-49ca-a0f6-e5d862f3d7da.png',
  tangram_pez: CLOUDFRONT_BASE + 'hf_20260808_121247_81333afd-3648-4a75-9ef5-95257123b9e7.png',
  cubo: CLOUDFRONT_BASE + 'hf_20260808_121248_a7174b1b-2a1e-4617-9ce1-3d68a005f925.png',
  piramide: CLOUDFRONT_BASE + 'hf_20260808_121247_079e0ca4-8896-4034-8487-e397c4db4cbd.png',
  cilindro: CLOUDFRONT_BASE + 'hf_20260808_121247_c6a261f1-a178-43aa-925f-d2cab0a096c9.png',
  cono: CLOUDFRONT_BASE + 'hf_20260808_121247_330c11f6-9402-4a66-8c4e-43de92e6c7b9.png',
  esfera: CLOUDFRONT_BASE + 'hf_20260808_121247_3f5ae4f5-52b8-4a7d-b2c7-e0b171c77456.png',
  red_cubo: CLOUDFRONT_BASE + 'hf_20260808_121247_4f831de1-767d-4fc7-9202-5d7387037c8d.png',
  red_piramide: CLOUDFRONT_BASE + 'hf_20260808_121247_6ab627c6-5040-43b2-96df-d05a4103cc52.png',
  formas_2d: CLOUDFRONT_BASE + 'hf_20260808_121247_ba72e9fe-821a-4d96-95c3-ec428ca0cec8.png',
  formas_contorno: CLOUDFRONT_BASE + 'hf_20260808_121247_692ece4b-500d-4eb6-a6c0-165d4a8e9f51.png',
  dado_blanco: CLOUDFRONT_BASE + 'hf_20260808_121345_037427fd-43e3-441e-b818-2adcc7c1b555.png',
  dado_rojo: CLOUDFRONT_BASE + 'hf_20260808_121345_eb5fef15-b815-40f3-866c-97d50fe39885.png',
  tablero_enteros: CLOUDFRONT_BASE + 'hf_20260808_121345_5787e1be-0306-44bd-b719-4f7cc1dde663.png',
  ficha_azul: CLOUDFRONT_BASE + 'hf_20260808_121345_c136cbda-520c-4eb5-9652-c267729a9be8.png',
  ficha_verde: CLOUDFRONT_BASE + 'hf_20260808_121345_90444e01-bd0a-4e1c-b1c9-24912d7d7245.png',
  casa_fachada: CLOUDFRONT_BASE + 'hf_20260808_121345_42e66b2d-d17f-4396-bc52-ca5fcf1419f6.png',
  casa_corte: CLOUDFRONT_BASE + 'hf_20260808_121617_7d41f11a-1997-499f-8797-08f2f0ea5b2a.png',
  cocina: CLOUDFRONT_BASE + 'hf_20260808_121617_7d47a355-de40-4aff-b7bf-8fcbcaa3a1c6.png',
  bano: CLOUDFRONT_BASE + 'hf_20260808_121617_41f70bdd-8492-4449-9f43-440645562ab6.png',
  sala: CLOUDFRONT_BASE + 'hf_20260808_121617_bf1ab3b3-c0ee-459e-b308-99c514e2989f.png',
  habitacion: CLOUDFRONT_BASE + 'hf_20260808_121617_6ca45560-803b-478d-9f4f-546e9132c3c1.png',
  objetos_cocina: CLOUDFRONT_BASE + 'hf_20260808_121617_ec2c0df9-3b12-4e27-8d61-146ae96810e6.png',
  objetos_casa: CLOUDFRONT_BASE + 'hf_20260808_121617_a7b930d3-6554-4ee7-af53-4e9298d39db4.png',
  retrato_profesora: CLOUDFRONT_BASE + 'hf_20260808_121714_d8ef303f-2a68-400b-8dc2-c30ebdf5812c.png',
  emocion_alegria: CLOUDFRONT_BASE + 'hf_20260808_121714_edec8e88-c59b-423a-a049-715075ba7a20.png',
  emocion_tristeza: CLOUDFRONT_BASE + 'hf_20260808_121714_320d776d-7b9e-4f80-9bd4-8a74811b58fa.png',
  emocion_enojo: CLOUDFRONT_BASE + 'hf_20260808_121714_e6dbf9d4-996b-4c94-94b0-2fc51b700cea.png',
  emocion_miedo: CLOUDFRONT_BASE + 'hf_20260808_121714_bd8d1935-a221-46d4-a8df-58912162d500.png',
  emocion_sorpresa: CLOUDFRONT_BASE + 'hf_20260808_121714_c49a363b-70bf-4c42-b63b-da27a90c8673.png',
  emocion_calma: CLOUDFRONT_BASE + 'hf_20260808_121714_9c779e90-717a-457c-955c-1f35c0b9e8fd.png',
  escena_consuelo: CLOUDFRONT_BASE + 'hf_20260808_121714_a077035e-2128-47cd-8262-2436452f8d4a.png'
};

export const ASSETS_GLB: Record<string, string> = {
  corazon: CLOUDFRONT_BASE + 'hf_20260808_121859_65fde6c9-fe8f-4715-818a-5c9b98a705bf.glb',
  cerebro: CLOUDFRONT_BASE + 'hf_20260808_121901_0473328e-4cd6-45af-beb4-2087ae2c3f1d.glb',
  cubo: CLOUDFRONT_BASE + 'hf_20260808_121813_99f029ea-5fd6-4e99-981b-dc4723b9aa4d.glb',
  piramide: CLOUDFRONT_BASE + 'hf_20260808_121815_70889eaf-6ee3-475c-b87e-d1f991d9336c.glb',
  cilindro: CLOUDFRONT_BASE + 'hf_20260808_121815_d38dee12-787d-4095-9d00-edb114172b3d.glb'
};

// --- Catálogo de plantillas (12 tipos definidos; 7 con renderer funcional) ---
export interface PlantillaInfo {
  id: ActividadTipo;
  nombre: string;
  descripcion: string;
  emoji: string;
  disponible: boolean;
}

export const PLANTILLAS: PlantillaInfo[] = [
  { id: 'seleccion', nombre: 'Selección Múltiple', descripcion: 'Elegir la respuesta correcta entre varias opciones.', emoji: '✅', disponible: true },
  { id: 'emparejar', nombre: 'Unir Parejas', descripcion: 'Conectar elementos de dos columnas (palabras o imágenes).', emoji: '🔗', disponible: true },
  { id: 'clasificar', nombre: 'Clasificar en Cajones', descripcion: 'Organizar elementos dentro de categorías.', emoji: '🗂️', disponible: true },
  { id: 'completar', nombre: 'Completar la Oración', descripcion: 'Llenar los espacios en blanco de una frase.', emoji: '🧩', disponible: true },
  { id: 'reconocer_emociones', nombre: 'Reconocer Emociones', descripcion: 'Identificar la emoción en una imagen o historia.', emoji: '😊', disponible: true },
  { id: 'explorador_3d', nombre: 'Explorador 3D', descripcion: 'Rotar un modelo 3D y descubrir sus partes.', emoji: '🧊', disponible: true },
  { id: 'autoevaluacion', nombre: 'Autoevaluación', descripcion: 'Tablero de emojis: el estudiante dice cómo se sintió.', emoji: '🌟', disponible: true },
  { id: 'identificar', nombre: 'Identificar Elemento', descripcion: 'Señalar un elemento específico en una imagen.', emoji: '👆', disponible: false },
  { id: 'escuchar_responder', nombre: 'Escuchar y Responder', descripcion: 'Audio con pregunta y opciones de respuesta.', emoji: '🎧', disponible: false },
  { id: 'ordenar', nombre: 'Ordenar Secuencia', descripcion: 'Poner pasos, números o letras en el orden correcto.', emoji: '🔢', disponible: false },
  { id: 'memoria', nombre: 'Juego de Memoria', descripcion: 'Encontrar las parejas de cartas boca abajo.', emoji: '🃏', disponible: false },
  { id: 'trazar_colorear', nombre: 'Trazar o Colorear', descripcion: 'Dibujar sobre un lienzo o colorear una imagen.', emoji: '🎨', disponible: false }
];

// --- Helpers para construir actividades del seed ---
function act(id: string, etapaId: string, tipo: ActividadTipo, titulo: string, preguntas: PreguntaConfig[]): Actividad {
  return {
    id,
    profesor_id: 'profesor-1',
    etapa_id: etapaId,
    tipo,
    titulo,
    configuracion: { preguntas, mostrarFelicitacion: true, vozSintetica: true }
  };
}

const p = (config: PreguntaConfig): PreguntaConfig => config;

// --- GUÍA 1: Andrés — Grado 8 · Tangram y dinero (matemáticas) ---
export const ETAPA_ANDRES = { id: 'etapa-andres', nombre: 'Guía Andrés — Grado 8 · Tangram y dinero', orden: 3, profesor_id: 'profesor-1' };

export const GUIA_ANDRES: Actividad[] = [
  act('act-andres-1', ETAPA_ANDRES.id, 'seleccion', '¿Cuántas piezas tiene el tangram?', [
    p({
      tipo: 'seleccion',
      datos: {
        id: 'preg-a1-1', instruccion: 'Mira el cuadrado del tangram. ¿Con cuántas piezas se arma?',
        imagenUrl: ASSETS.tangram_cuadrado,
        opciones: [
          { id: 'op-a1-1', texto: '5 piezas', esCorrecta: false },
          { id: 'op-a1-2', texto: '7 piezas', esCorrecta: true },
          { id: 'op-a1-3', texto: '9 piezas', esCorrecta: false }
        ]
      }
    })
  ]),
  act('act-andres-2', ETAPA_ANDRES.id, 'seleccion', 'El billete de mayor valor', [
    p({
      tipo: 'seleccion',
      datos: {
        id: 'preg-a2-1', instruccion: 'Mira la pila de billetes. ¿Cuál billete vale más?',
        imagenUrl: ASSETS.pila_billetes,
        opciones: [
          { id: 'op-a2-1', texto: '$1.000', esCorrecta: false },
          { id: 'op-a2-2', texto: '$20.000', esCorrecta: false },
          { id: 'op-a2-3', texto: '$50.000', esCorrecta: true }
        ]
      }
    })
  ]),
  act('act-andres-3', ETAPA_ANDRES.id, 'seleccion', 'Comprando en el kiosco', [
    p({
      tipo: 'seleccion',
      datos: {
        id: 'preg-a3-1', instruccion: 'En el kiosco el jugo cuesta $5.000. ¿Qué billete usas para pagar?',
        imagenUrl: ASSETS.kiosco,
        opciones: [
          { id: 'op-a3-1', texto: '$1.000', esCorrecta: false },
          { id: 'op-a3-2', texto: '$5.000', esCorrecta: true },
          { id: 'op-a3-3', texto: '$10.000', esCorrecta: false }
        ]
      }
    })
  ]),
  act('act-andres-4', ETAPA_ANDRES.id, 'completar', 'Completa la frase del dinero', [
    p({
      tipo: 'completar',
      datos: {
        id: 'preg-a4-1', instruccion: 'Completa la oración con las palabras correctas.',
        imagenUrl: ASSETS.monedas,
        oracionConHuecos: 'Con un billete de [mil] y uno de [dos mil] tengo tres mil pesos.',
        palabrasOpciones: ['mil', 'dos mil', 'tres mil', 'cinco mil'],
        respuestasCorrectas: { 0: 'mil', 1: 'dos mil' }
      }
    })
  ]),
  act('act-andres-5', ETAPA_ANDRES.id, 'emparejar', 'Cambios del billete', [
    p({
      tipo: 'emparejar',
      datos: {
        id: 'preg-a5-1', instruccion: 'Une cada billete con su cambio equivalente.',
        imagenUrl: ASSETS.billete_2000,
        parejas: [
          { id: 'p-a5-1', origen: 'Billete de $2.000', origenTipo: 'texto', destino: 'Dos billetes de $1.000', destinoTipo: 'texto' },
          { id: 'p-a5-2', origen: 'Billete de $10.000', origenTipo: 'texto', destino: 'Dos billetes de $5.000', destinoTipo: 'texto' },
          { id: 'p-a5-3', origen: 'Billete de $50.000', origenTipo: 'texto', destino: 'Cinco billetes de $10.000', destinoTipo: 'texto' }
        ]
      }
    })
  ]),
  act('act-andres-6', ETAPA_ANDRES.id, 'explorador_3d', 'Explora el cubo', [
    p({
      tipo: 'explorador_3d',
      datos: {
        id: 'preg-a6-1', instruccion: 'Toca los botones para descubrir las partes del cubo.',
        modeloUrl: ASSETS_GLB.cubo, nombreObjeto: 'El cubo',
        puntosDeInteres: [
          { id: 'punto-a6-1', nombre: 'La cara', descripcion: 'Cada cara del cubo es un cuadrado.' },
          { id: 'punto-a6-2', nombre: 'La arista', descripcion: 'La línea donde se juntan dos caras.' },
          { id: 'punto-a6-3', nombre: 'El vértice', descripcion: 'El punto donde se juntan tres aristas.' }
        ],
        objetivo: 'Descubrir cara, arista y vértice.'
      }
    })
  ]),
  act('act-andres-7', ETAPA_ANDRES.id, 'explorador_3d', 'Explora la pirámide', [
    p({
      tipo: 'explorador_3d',
      datos: {
        id: 'preg-a7-1', instruccion: 'Explora la pirámide y toca sus partes.',
        modeloUrl: ASSETS_GLB.piramide, nombreObjeto: 'La pirámide',
        puntosDeInteres: [
          { id: 'punto-a7-1', nombre: 'La base', descripcion: 'La base de la pirámide es un cuadrado.' },
          { id: 'punto-a7-2', nombre: 'Las caras', descripcion: 'Los lados son triángulos.' },
          { id: 'punto-a7-3', nombre: 'La cúspide', descripcion: 'El punto más alto de la pirámide.' }
        ],
        objetivo: 'Descubrir base, caras y cúspide.'
      }
    })
  ]),
  act('act-andres-8', ETAPA_ANDRES.id, 'autoevaluacion', '¿Cómo te fue con el tangram?', [
    p({
      tipo: 'autoevaluacion',
      datos: {
        id: 'preg-a8-1', instruccion: 'Toca el emoji que muestra cómo te sentiste.',
        escala: [
          { id: 'muy_bien', etiqueta: 'Muy bien', emoji: '🌟', color: '#22c55e' },
          { id: 'bien', etiqueta: 'Bien', emoji: '👍', color: '#3b82f6' },
          { id: 'regular', etiqueta: 'Regular', emoji: '😐', color: '#f59e0b' },
          { id: 'necesito_ayuda', etiqueta: 'Necesito ayuda', emoji: '🤝', color: '#ef4444' }
        ],
        reflexion: '¿Qué fue lo más difícil del tangram?'
      }
    })
  ])
];

// --- GUÍA 2: David — Grado 7 · Números enteros ---
export const ETAPA_DAVID = { id: 'etapa-david', nombre: 'Guía David — Grado 7 · Números enteros', orden: 4, profesor_id: 'profesor-1' };

export const GUIA_DAVID: Actividad[] = [
  act('act-david-1', ETAPA_DAVID.id, 'seleccion', 'A la izquierda del cero', [
    p({
      tipo: 'seleccion',
      datos: {
        id: 'preg-d1-1', instruccion: 'Mira el tablero. ¿Qué número está a la izquierda del cero?',
        imagenUrl: ASSETS.tablero_enteros,
        opciones: [
          { id: 'op-d1-1', texto: '-1', esCorrecta: true },
          { id: 'op-d1-2', texto: '+1', esCorrecta: false },
          { id: 'op-d1-3', texto: '0', esCorrecta: false }
        ]
      }
    })
  ]),
  act('act-david-2', ETAPA_DAVID.id, 'seleccion', 'Frío o caliente', [
    p({
      tipo: 'seleccion',
      datos: {
        id: 'preg-d2-1', instruccion: 'El termómetro marca -5. ¿Ese número es frío o caliente?',
        imagenUrl: ASSETS.hielo,
        opciones: [
          { id: 'op-d2-1', texto: 'Frío', esCorrecta: true },
          { id: 'op-d2-2', texto: 'Caliente', esCorrecta: false },
          { id: 'op-d2-3', texto: 'Ni frío ni caliente', esCorrecta: false }
        ]
      }
    })
  ]),
  act('act-david-3', ETAPA_DAVID.id, 'completar', 'Derecha e izquierda en el tablero', [
    p({
      tipo: 'completar',
      datos: {
        id: 'preg-d3-1', instruccion: 'Completa la oración sobre el tablero.',
        imagenUrl: ASSETS.tablero_enteros,
        oracionConHuecos: 'El número +3 está a la [derecha] del cero y el -3 a la [izquierda].',
        palabrasOpciones: ['derecha', 'izquierda', 'arriba', 'abajo'],
        respuestasCorrectas: { 0: 'derecha', 1: 'izquierda' }
      }
    })
  ]),
  act('act-david-4', ETAPA_DAVID.id, 'explorador_3d', 'El dado del parqués', [
    p({
      tipo: 'explorador_3d',
      datos: {
        id: 'preg-d4-1', instruccion: 'Gira el dado y descubre sus partes.',
        modeloUrl: ASSETS_GLB.cubo, nombreObjeto: 'El dado',
        puntosDeInteres: [
          { id: 'punto-d4-1', nombre: 'Una cara', descripcion: 'Aquí viven los puntos del dado.' },
          { id: 'punto-d4-2', nombre: 'Una arista', descripcion: 'Se junta con otra cara del dado.' },
          { id: 'punto-d4-3', nombre: 'Un vértice', descripcion: 'Esquina donde se tocan tres caras.' }
        ],
        objetivo: 'Descubrir las partes del dado.'
      }
    })
  ]),
  act('act-david-5', ETAPA_DAVID.id, 'seleccion', '¿Cuántas caras tiene el dado?', [
    p({
      tipo: 'seleccion',
      datos: {
        id: 'preg-d5-1', instruccion: 'Un dado de parqués tiene 1, 2, 3, 4, 5 y 6. ¿Cuántas caras tiene en total?',
        imagenUrl: ASSETS.dado_rojo,
        opciones: [
          { id: 'op-d5-1', texto: '5 caras', esCorrecta: false },
          { id: 'op-d5-2', texto: '6 caras', esCorrecta: true },
          { id: 'op-d5-3', texto: '7 caras', esCorrecta: false }
        ]
      }
    })
  ]),
  act('act-david-6', ETAPA_DAVID.id, 'autoevaluacion', 'Números enteros: ¿cómo te fue?', [
    p({
      tipo: 'autoevaluacion',
      datos: {
        id: 'preg-d6-1', instruccion: 'Toca el emoji que muestra cómo te sentiste.',
        escala: [
          { id: 'muy_bien', etiqueta: 'Muy bien', emoji: '🌟', color: '#22c55e' },
          { id: 'bien', etiqueta: 'Bien', emoji: '👍', color: '#3b82f6' },
          { id: 'regular', etiqueta: 'Regular', emoji: '😐', color: '#f59e0b' },
          { id: 'necesito_ayuda', etiqueta: 'Necesito ayuda', emoji: '🤝', color: '#ef4444' }
        ],
        reflexion: '¿Qué número del tablero te pareció más difícil?'
      }
    })
  ])
];

// --- GUÍA 3: Yessica — Grado 8 · La casa (inglés / español) ---
export const ETAPA_YESSICA = { id: 'etapa-yessica', nombre: 'Guía Yessica — Grado 8 · La casa EN/ES', orden: 5, profesor_id: 'profesor-1' };

export const GUIA_YESSICA: Actividad[] = [
  act('act-yessica-1', ETAPA_YESSICA.id, 'emparejar', 'La casa en inglés y español', [
    p({
      tipo: 'emparejar',
      datos: {
        id: 'preg-y1-1', instruccion: 'Une cada palabra en inglés con su traducción.',
        imagenUrl: ASSETS.casa_fachada,
        parejas: [
          { id: 'p-y1-1', origen: 'Kitchen', origenTipo: 'texto', destino: 'Cocina', destinoTipo: 'texto' },
          { id: 'p-y1-2', origen: 'Bathroom', origenTipo: 'texto', destino: 'Baño', destinoTipo: 'texto' },
          { id: 'p-y1-3', origen: 'Living room', origenTipo: 'texto', destino: 'Sala', destinoTipo: 'texto' },
          { id: 'p-y1-4', origen: 'Bedroom', origenTipo: 'texto', destino: 'Habitación', destinoTipo: 'texto' }
        ]
      }
    })
  ]),
  act('act-yessica-2', ETAPA_YESSICA.id, 'seleccion', '¿Qué hay en la cocina?', [
    p({
      tipo: 'seleccion',
      datos: {
        id: 'preg-y2-1', instruccion: 'Mira los objetos. ¿Cuál pertenece a la cocina?',
        imagenUrl: ASSETS.objetos_cocina,
        opciones: [
          { id: 'op-y2-1', texto: 'La estufa', esCorrecta: true },
          { id: 'op-y2-2', texto: 'La cama', esCorrecta: false },
          { id: 'op-y2-3', texto: 'El espejo', esCorrecta: false }
        ]
      }
    })
  ]),
  act('act-yessica-3', ETAPA_YESSICA.id, 'clasificar', '¿Cocina o baño?', [
    p({
      tipo: 'clasificar',
      datos: {
        id: 'preg-y3-1', instruccion: 'Coloca cada objeto en el lugar de la casa donde va.',
        imagenUrl: ASSETS.casa_corte,
        categorias: [
          { id: 'cat-y-cocina', nombre: 'Cocina' },
          { id: 'cat-y-bano', nombre: 'Baño' }
        ],
        elementos: [
          { id: 'el-y-1', texto: 'La estufa', categoriaId: 'cat-y-cocina' },
          { id: 'el-y-2', texto: 'El lavamanos', categoriaId: 'cat-y-bano' },
          { id: 'el-y-3', texto: 'La nevera', categoriaId: 'cat-y-cocina' },
          { id: 'el-y-4', texto: 'La ducha', categoriaId: 'cat-y-bano' }
        ]
      }
    })
  ]),
  act('act-yessica-4', ETAPA_YESSICA.id, 'seleccion', '¿Qué parte de la casa es?', [
    p({
      tipo: 'seleccion',
      datos: {
        id: 'preg-y4-1', instruccion: 'Mira la imagen. ¿Qué parte de la casa es?',
        imagenUrl: ASSETS.sala,
        opciones: [
          { id: 'op-y4-1', texto: 'La sala', esCorrecta: true },
          { id: 'op-y4-2', texto: 'La cocina', esCorrecta: false },
          { id: 'op-y4-3', texto: 'El baño', esCorrecta: false }
        ]
      }
    })
  ]),
  act('act-yessica-5', ETAPA_YESSICA.id, 'reconocer_emociones', '¿Cómo se siente?', [
    p({
      tipo: 'reconocer_emociones',
      datos: {
        id: 'preg-y5-1', instruccion: 'Mira la cara de la persona. ¿Qué emoción tiene?',
        rostroImagenUrl: ASSETS.emocion_alegria,
        emocionCorrecta: 'alegría',
        opciones: [
          { id: 'e-y5-1', emocion: 'alegría' },
          { id: 'e-y5-2', emocion: 'tristeza' },
          { id: 'e-y5-3', emocion: 'enojo' }
        ]
      }
    })
  ]),
  act('act-yessica-6', ETAPA_YESSICA.id, 'autoevaluacion', 'La casa: ¿cómo te fue?', [
    p({
      tipo: 'autoevaluacion',
      datos: {
        id: 'preg-y6-1', instruccion: 'Toca el emoji que muestra cómo te sentiste.',
        escala: [
          { id: 'muy_bien', etiqueta: 'Muy bien', emoji: '🌟', color: '#22c55e' },
          { id: 'bien', etiqueta: 'Bien', emoji: '👍', color: '#3b82f6' },
          { id: 'regular', etiqueta: 'Regular', emoji: '😐', color: '#f59e0b' },
          { id: 'necesito_ayuda', etiqueta: 'Necesito ayuda', emoji: '🤝', color: '#ef4444' }
        ],
        reflexion: '¿Qué palabra en inglés te gustaría aprender más?'
      }
    })
  ])
];

// --- GUÍA 4: María Paula — Grado 9 · Biología (cuerpo y climas) ---
export const ETAPA_MARIA = { id: 'etapa-maria', nombre: 'Guía María Paula — Grado 9 · Biología', orden: 6, profesor_id: 'profesor-1' };

export const GUIA_MARIA: Actividad[] = [
  act('act-maria-1', ETAPA_MARIA.id, 'explorador_3d', 'Explora el corazón', [
    p({
      tipo: 'explorador_3d',
      datos: {
        id: 'preg-m1-1', instruccion: 'Gira el corazón y toca los botones para descubrir sus partes.',
        modeloUrl: ASSETS_GLB.corazon, nombreObjeto: 'El corazón',
        puntosDeInteres: [
          { id: 'punto-m1-1', nombre: 'Aurícula', descripcion: 'Recibe la sangre que llega al corazón.' },
          { id: 'punto-m1-2', nombre: 'Ventrículo', descripcion: 'Bombea la sangre hacia el cuerpo.' },
          { id: 'punto-m1-3', nombre: 'Aorta', descripcion: 'La arteria más grande, lleva sangre a todo el cuerpo.' }
        ],
        objetivo: 'Descubrir las partes del corazón y su función.'
      }
    })
  ]),
  act('act-maria-2', ETAPA_MARIA.id, 'explorador_3d', 'Explora el cerebro', [
    p({
      tipo: 'explorador_3d',
      datos: {
        id: 'preg-m2-1', instruccion: 'Explora el cerebro y toca sus partes.',
        modeloUrl: ASSETS_GLB.cerebro, nombreObjeto: 'El cerebro',
        puntosDeInteres: [
          { id: 'punto-m2-1', nombre: 'Lóbulo frontal', descripcion: 'Nos ayuda a pensar y planear.' },
          { id: 'punto-m2-2', nombre: 'Lóbulo temporal', descripcion: 'Nos ayuda a escuchar.' },
          { id: 'punto-m2-3', nombre: 'Cerebelo', descripcion: 'Nos ayuda a mantener el equilibrio.' }
        ],
        objetivo: 'Descubrir las partes del cerebro.'
      }
    })
  ]),
  act('act-maria-3', ETAPA_MARIA.id, 'seleccion', '¿Qué órgano es este?', [
    p({
      tipo: 'seleccion',
      datos: {
        id: 'preg-m3-1', instruccion: 'Mira la imagen. ¿Qué órgano del sentido es?',
        imagenUrl: ASSETS.ojo,
        opciones: [
          { id: 'op-m3-1', texto: 'El ojo', esCorrecta: true },
          { id: 'op-m3-2', texto: 'La oreja', esCorrecta: false },
          { id: 'op-m3-3', texto: 'La piel', esCorrecta: false }
        ]
      }
    })
  ]),
  act('act-maria-4', ETAPA_MARIA.id, 'emparejar', 'Cada sentido con su órgano', [
    p({
      tipo: 'emparejar',
      datos: {
        id: 'preg-m4-1', instruccion: 'Une cada órgano con lo que hace.',
        imagenUrl: ASSETS.cuerpo_corazon,
        parejas: [
          { id: 'p-m4-1', origen: 'El ojo', origenTipo: 'texto', destino: 'Ver', destinoTipo: 'texto' },
          { id: 'p-m4-2', origen: 'La oreja', origenTipo: 'texto', destino: 'Oír', destinoTipo: 'texto' },
          { id: 'p-m4-3', origen: 'La piel', origenTipo: 'texto', destino: 'Tocar', destinoTipo: 'texto' }
        ]
      }
    })
  ]),
  act('act-maria-5', ETAPA_MARIA.id, 'seleccion', '¿Qué animal vive en el polo?', [
    p({
      tipo: 'seleccion',
      datos: {
        id: 'preg-m5-1', instruccion: 'Mira el paisaje. ¿Qué animal vive en el polo norte?',
        imagenUrl: ASSETS.paisaje_polo,
        opciones: [
          { id: 'op-m5-1', texto: 'El oso polar', esCorrecta: true },
          { id: 'op-m5-2', texto: 'El camello', esCorrecta: false },
          { id: 'op-m5-3', texto: 'El león', esCorrecta: false }
        ]
      }
    })
  ]),
  act('act-maria-6', ETAPA_MARIA.id, 'clasificar', '¿Frío o calor?', [
    p({
      tipo: 'clasificar',
      datos: {
        id: 'preg-m6-1', instruccion: 'Coloca cada animal en el clima donde vive.',
        imagenUrl: ASSETS.paisaje_desierto,
        categorias: [
          { id: 'cat-m-frio', nombre: 'Frío' },
          { id: 'cat-m-calor', nombre: 'Calor' }
        ],
        elementos: [
          { id: 'el-m-1', texto: 'Oso polar', categoriaId: 'cat-m-frio' },
          { id: 'el-m-2', texto: 'Camello', categoriaId: 'cat-m-calor' },
          { id: 'el-m-3', texto: 'Pingüino', categoriaId: 'cat-m-frio' },
          { id: 'el-m-4', texto: 'León', categoriaId: 'cat-m-calor' }
        ]
      }
    })
  ]),
  act('act-maria-7', ETAPA_MARIA.id, 'seleccion', '¿Qué sentimos con la piel?', [
    p({
      tipo: 'seleccion',
      datos: {
        id: 'preg-m7-1', instruccion: 'Tocas un cubo de hielo. ¿Qué sientes con la piel?',
        imagenUrl: ASSETS.hielo,
        opciones: [
          { id: 'op-m7-1', texto: 'Frío', esCorrecta: true },
          { id: 'op-m7-2', texto: 'Dulce', esCorrecta: false },
          { id: 'op-m7-3', texto: 'Ruido', esCorrecta: false }
        ]
      }
    })
  ]),
  act('act-maria-8', ETAPA_MARIA.id, 'autoevaluacion', 'Mi cuerpo: ¿cómo te fue?', [
    p({
      tipo: 'autoevaluacion',
      datos: {
        id: 'preg-m8-1', instruccion: 'Toca el emoji que muestra cómo te sentiste.',
        escala: [
          { id: 'muy_bien', etiqueta: 'Muy bien', emoji: '🌟', color: '#22c55e' },
          { id: 'bien', etiqueta: 'Bien', emoji: '👍', color: '#3b82f6' },
          { id: 'regular', etiqueta: 'Regular', emoji: '😐', color: '#f59e0b' },
          { id: 'necesito_ayuda', etiqueta: 'Necesito ayuda', emoji: '🤝', color: '#ef4444' }
        ],
        reflexion: '¿Qué parte del cuerpo te gustó más explorar?'
      }
    })
  ])
];

// --- GUÍA 5: Convivencia — Emociones y autorregulación ---
export const ETAPA_EMOCIONES = { id: 'etapa-emociones', nombre: 'Guía Convivencia — Emociones', orden: 7, profesor_id: 'profesor-1' };

export const GUIA_EMOCIONES: Actividad[] = [
  act('act-emoc-1', ETAPA_EMOCIONES.id, 'seleccion', '¿Qué emoción es?', [
    p({
      tipo: 'seleccion',
      datos: {
        id: 'preg-e1-1', instruccion: 'Mira el rostro de la profesora. ¿Qué emoción muestra?',
        imagenUrl: ASSETS.retrato_profesora,
        opciones: [
          { id: 'op-e1-1', texto: 'Alegría', esCorrecta: true },
          { id: 'op-e1-2', texto: 'Tristeza', esCorrecta: false },
          { id: 'op-e1-3', texto: 'Enojo', esCorrecta: false }
        ]
      }
    })
  ]),
  act('act-emoc-2', ETAPA_EMOCIONES.id, 'reconocer_emociones', '¡Qué sorpresa!', [
    p({
      tipo: 'reconocer_emociones',
      datos: {
        id: 'preg-e2-1', instruccion: 'Mira la cara de la persona. ¿Qué emoción tiene?',
        rostroImagenUrl: ASSETS.emocion_sorpresa,
        emocionCorrecta: 'sorpresa',
        opciones: [
          { id: 'e-e2-1', emocion: 'sorpresa' },
          { id: 'e-e2-2', emocion: 'alegría' },
          { id: 'e-e2-3', emocion: 'miedo' }
        ]
      }
    })
  ]),
  act('act-emoc-3', ETAPA_EMOCIONES.id, 'seleccion', 'Un amigo está triste', [
    p({
      tipo: 'seleccion',
      datos: {
        id: 'preg-e3-1', instruccion: 'Mira la escena. Tu amiga se siente triste. ¿Qué puedes hacer?',
        imagenUrl: ASSETS.escena_consuelo,
        opciones: [
          { id: 'op-e3-1', texto: 'Consolarla con un abrazo', esCorrecta: true },
          { id: 'op-e3-2', texto: 'Irme sin decir nada', esCorrecta: false },
          { id: 'op-e3-3', texto: 'Reírme de ella', esCorrecta: false }
        ]
      }
    })
  ]),
  act('act-emoc-4', ETAPA_EMOCIONES.id, 'seleccion', '¿Cómo se siente?', [
    p({
      tipo: 'seleccion',
      datos: {
        id: 'preg-e4-1', instruccion: 'Mira la imagen. ¿Qué emoción está sintiendo?',
        imagenUrl: ASSETS.emocion_miedo,
        opciones: [
          { id: 'op-e4-1', texto: 'Miedo', esCorrecta: true },
          { id: 'op-e4-2', texto: 'Alegría', esCorrecta: false },
          { id: 'op-e4-3', texto: 'Calma', esCorrecta: false }
        ]
      }
    })
  ]),
  act('act-emoc-5', ETAPA_EMOCIONES.id, 'autoevaluacion', '¿Cómo te sentiste hoy?', [
    p({
      tipo: 'autoevaluacion',
      datos: {
        id: 'preg-e5-1', instruccion: 'Toca el emoji que muestra cómo te sientes hoy.',
        escala: [
          { id: 'muy_bien', etiqueta: 'Muy bien', emoji: '🌟', color: '#22c55e' },
          { id: 'bien', etiqueta: 'Bien', emoji: '👍', color: '#3b82f6' },
          { id: 'regular', etiqueta: 'Regular', emoji: '😐', color: '#f59e0b' },
          { id: 'necesito_ayuda', etiqueta: 'Necesito ayuda', emoji: '🤝', color: '#ef4444' }
        ],
        reflexion: '¿Qué te hizo sentir bien hoy?'
      }
    })
  ])
];

// Etapas de las 5 guías (para MOCK_ETAPAS)
export const ETAPAS_GUIA: Etapa[] = [ETAPA_ANDRES, ETAPA_DAVID, ETAPA_YESSICA, ETAPA_MARIA, ETAPA_EMOCIONES];

// Todas las actividades de las guías (para MOCK_ACTIVIDADES)
export const ACTIVIDADES_GUIA: Actividad[] = [
  ...GUIA_ANDRES,
  ...GUIA_DAVID,
  ...GUIA_YESSICA,
  ...GUIA_MARIA,
  ...GUIA_EMOCIONES
];
