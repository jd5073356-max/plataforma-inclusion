import { supabase, isSupabaseConfigured } from './supabase';
import { Actividad, ActividadTipo, Perfil, Etapa, Asignacion, Progreso, Recurso } from '../types/actividad';
import { ETAPAS_GUIA } from './plantillas';
import seedActivitiesRaw from './seed-activities.json';

const SEED_ACTIVITIES: Actividad[] = (seedActivitiesRaw as any[]).map((a, i) => ({
  ...a,
  id: a.id || `seed-act-${i + 1}`
}));

// Helper for generating student emails internally
export function correoInterno(nombre: string, curso: string): string {
  const limpio = (t: string) =>
    t.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `${limpio(nombre)}.${limpio(curso)}@inclusion.local`;
}

// Initial mock data if localStorage is empty
const MOCK_PROFILES: Perfil[] = [
  { id: 'profesor-1', rol: 'profesor', nombre: 'Profesor Ejemplo', curso: 'General' },
  { id: 'estudiante-1', rol: 'estudiante', nombre: 'Estudiante Ejemplo', curso: '3A', profesor_id: 'profesor-1' },
  { id: 'estudiante-2', rol: 'estudiante', nombre: 'Estudiante Ejemplo 2', curso: '4B', profesor_id: 'profesor-1' },
  { id: 'admin-1', rol: 'admin', nombre: 'Administrador' }
];

const MOCK_ETAPAS: Etapa[] = [
  ...ETAPAS_GUIA
];

const MOCK_ACTIVIDADES: Actividad[] = [
  // Plantillas base del Banco (etapa_id = undefined ⇒ reutilizables en cualquier ruta)
  {
    id: 'act-1',
    profesor_id: 'profesor-1',
    tipo: 'seleccion',
    titulo: '¿Qué fruta es roja?',
    configuracion: {
      mostrarFelicitacion: true,
      vozSintetica: true,
      preguntas: [
        {
          tipo: 'seleccion',
          datos: {
            id: 'preg-sel-1',
            instruccion: 'Selecciona la fruta que es de color rojo brillante.',
            opciones: [
              { id: 'op-1', texto: 'Plátano', esCorrecta: false },
              { id: 'op-2', texto: 'Manzana', esCorrecta: true },
              { id: 'op-3', texto: 'Uva verde', esCorrecta: false }
            ]
          }
        }
      ]
    }
  },
  {
    id: 'act-2',
    profesor_id: 'profesor-1',
    tipo: 'emparejar',
    titulo: 'Une los opuestos',
    configuracion: {
      mostrarFelicitacion: true,
      vozSintetica: true,
      preguntas: [
        {
          tipo: 'emparejar',
          datos: {
            id: 'preg-emp-1',
            instruccion: 'Une cada dibujo o palabra con su opuesto.',
            parejas: [
              { id: 'p-1', origen: 'Sol (Día)', origenTipo: 'texto', destino: 'Luna (Noche)', destinoTipo: 'texto' },
              { id: 'p-2', origen: 'Frío', origenTipo: 'texto', destino: 'Calor', destinoTipo: 'texto' },
              { id: 'p-3', origen: 'Grande', origenTipo: 'texto', destino: 'Pequeño', destinoTipo: 'texto' }
            ]
          }
        }
      ]
    }
  },
  {
    id: 'act-3',
    profesor_id: 'profesor-1',
    tipo: 'clasificar',
    titulo: 'Frutas vs Verduras',
    configuracion: {
      mostrarFelicitacion: true,
      vozSintetica: true,
      preguntas: [
        {
          tipo: 'clasificar',
          datos: {
            id: 'preg-cla-1',
            instruccion: 'Pon cada alimento en su cajón correspondiente.',
            categorias: [
              { id: 'cat-frutas', nombre: 'Frutas' },
              { id: 'cat-verduras', nombre: 'Verduras' }
            ],
            elementos: [
              { id: 'el-1', texto: 'Manzana', categoriaId: 'cat-frutas' },
              { id: 'el-2', texto: 'Zanahoria', categoriaId: 'cat-verduras' },
              { id: 'el-3', texto: 'Plátano', categoriaId: 'cat-frutas' },
              { id: 'el-4', texto: 'Lechuga', categoriaId: 'cat-verduras' }
            ]
          }
        }
      ]
    }
  },
  {
    id: 'act-4',
    profesor_id: 'profesor-1',
    tipo: 'completar',
    titulo: 'Completa la frase',
    configuracion: {
      mostrarFelicitacion: true,
      vozSintetica: true,
      preguntas: [
        {
          tipo: 'completar',
          datos: {
            id: 'preg-comp-1',
            instruccion: 'Arrastra la palabra correcta para completar la oración.',
            oracionConHuecos: 'El cielo es de color [azul] y las plantas son de color [verde].',
            palabrasOpciones: ['azul', 'verde', 'rojo', 'amarillo'],
            respuestasCorrectas: { 0: 'azul', 1: 'verde' }
          }
        }
      ]
    }
  },
  {
    id: 'act-5',
    profesor_id: 'profesor-1',
    tipo: 'reconocer_emociones',
    titulo: 'Identifica la emoción',
    configuracion: {
      mostrarFelicitacion: true,
      vozSintetica: true,
      preguntas: [
        {
          tipo: 'reconocer_emociones',
          datos: {
            id: 'preg-emoc-1',
            instruccion: 'Mira la imagen y di cómo se siente la persona.',
            rostroImagenUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', // placeholder o pictograma
            emocionCorrecta: 'alegría',
            opciones: [
              { id: 'e-1', emocion: 'alegría' },
              { id: 'e-2', emocion: 'tristeza' },
              { id: 'e-3', emocion: 'enojo' }
            ]
          }
        }
      ]
    }
  }
];

const MOCK_ASIGNACIONES: Asignacion[] = [
  // El estudiante se asigna a RUTAS (etapas), no a actividades sueltas
  { id: 'asig-1', estudiante_id: 'estudiante-1', etapa_id: 'etapa-andres', ajuste: 'cognitiva' },
  { id: 'asig-2', estudiante_id: 'estudiante-1', etapa_id: 'etapa-emociones', ajuste: 'cognitiva' },
  { id: 'asig-3', estudiante_id: 'estudiante-2', etapa_id: 'etapa-david', ajuste: 'tea' }
];

const MOCK_PROGRESO: Progreso[] = [
  { id: 'prog-1', estudiante_id: 'estudiante-1', actividad_id: 'act-1', completado: true, intentos: 2 },
  { id: 'prog-2', estudiante_id: 'estudiante-1', actividad_id: 'act-2', completado: false, intentos: 1 }
];

// LocalStorage helpers
function getStored<T>(key: string, fallback: T): T {
  const val = localStorage.getItem(key);
  if (!val) {
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
  return JSON.parse(val);
}

function setStored<T>(key: string, val: T) {
  localStorage.setItem(key, JSON.stringify(val));
}

// Inicia datos de prueba si no existen
export function inicializarMockDB() {
  getStored('perfiles', MOCK_PROFILES);
  getStored('etapas', MOCK_ETAPAS);
  getStored('actividades', MOCK_ACTIVIDADES);
  getStored('asignaciones', MOCK_ASIGNACIONES);
  getStored('progreso', MOCK_PROGRESO);
  getStored('currentUser', null);
}

// Init immediately
if (!isSupabaseConfigured) {
  inicializarMockDB();
}

// Modo mock de emergencia: si Supabase está configurado pero el proyecto es
// inalcanzable (pausado/DNS caído), la app conmuta a localStorage y sigue usable.
let modoMock = !isSupabaseConfigured;

const usarSupabase = () => isSupabaseConfigured && !modoMock;

export function activarModoMock() {
  if (!modoMock) {
    modoMock = true;
    inicializarMockDB();
  }
}

// Health-check al arranque: si Supabase no responde (proyecto pausado, DNS caído,
// timeout), se conmuta a mock ANTES del login para no colgar la app.
// 401/403/404 cuentan como "alcanzable" (problema de llave, no de proyecto muerto).
export async function prepararModoDatos(): Promise<void> {
  if (!isSupabaseConfigured || modoMock) return;
  const url = import.meta.env.VITE_SUPABASE_URL as string;
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), 4000);
  try {
    const res = await fetch(`${url}/auth/v1/health`, { signal: controlador.signal });
    if (res.status >= 500) activarModoMock();
  } catch {
    activarModoMock();
  } finally {
    clearTimeout(temporizador);
  }
}

// Central database controller
export const db = {
  // --- AUTH ---
  async signUp(email: string, pass: string, name: string, rol: 'admin'|'profesor'|'estudiante', extra: any = {}) {
    if (usarSupabase()) {
      const { data, error } = await supabase.auth.signUp({ email, password: pass });
      if (error) throw error;
      
      const { error: profileError } = await supabase.from('perfiles').insert({
        id: data.user!.id,
        rol,
        nombre: name,
        ...extra
      });
      if (profileError) throw profileError;
      return data.user;
    } else {
      const perfiles = getStored<Perfil[]>('perfiles', []);
      const newId = `usr-${Math.random().toString(36).substr(2, 9)}`;
      const newUser: Perfil = {
        id: newId,
        rol,
        nombre: name,
        curso: extra.curso || '',
        profesor_id: extra.profesor_id || null,
        creado_en: new Date().toISOString()
      };
      perfiles.push(newUser);
      setStored('perfiles', perfiles);
      
      const mockCreds = getStored<any[]>('mock_creds', []);
      mockCreds.push({ email, pass, userId: newId });
      setStored('mock_creds', mockCreds);

      return { id: newId, email };
    }
  },

  async signIn(email: string, pass: string) {
    if (usarSupabase()) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
      const { data: profile } = await supabase.from('perfiles').select('*').eq('id', data.user.id).single();
      return { user: data.user, profile };
    } else {
      const mockCreds = getStored<any[]>('mock_creds', []);
      const match = mockCreds.find(c => c.email.toLowerCase() === email.toLowerCase() && c.pass === pass);
      
      // Also allow default login for mocks
      let userProfile: Perfil | undefined;
      const perfiles = getStored<Perfil[]>('perfiles', []);

      if (match) {
        userProfile = perfiles.find(p => p.id === match.userId);
      } else {
        // Default login helper for student/prof/admin using email mapping
        if (email.endsWith('@inclusion.local')) {
          // It's a generated email. Let's see if we match standard name
          const matchStudent = perfiles.find(p => correoInterno(p.nombre, p.curso || '') === email.toLowerCase());
          if (matchStudent && pass === '123456') { // default mock password
            userProfile = matchStudent;
          }
        } else if (email === 'educador@escuela.edu.co' && pass === '123456') {
          userProfile = perfiles.find(p => p.id === 'profesor-1');
        } else if (email === 'admin@inclusion.com' && pass === '123456') {
          userProfile = perfiles.find(p => p.id === 'admin-1');
        }
      }

      if (!userProfile) {
        throw new Error('Credenciales incorrectas (Usa contraseña "123456" para usuarios predeterminados)');
      }

      const sessionObj = { id: userProfile.id, email, userProfile };
      setStored('currentUser', sessionObj);
      return { user: { id: userProfile.id, email }, profile: userProfile };
    }
  },

  async getCurrentUser() {
    if (usarSupabase()) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data: profile } = await supabase.from('perfiles').select('*').eq('id', user.id).single();
      return { user, profile };
    } else {
      const current = getStored<any>('currentUser', null);
      if (!current) return null;
      return { user: { id: current.id, email: current.email }, profile: current.userProfile };
    }
  },

  async signOut() {
    if (usarSupabase()) {
      await supabase.auth.signOut();
    } else {
      setStored('currentUser', null);
    }
  },

  // --- PERFILES & ESTUDIANTES ---
  async getEstudiantesPorProfesor(profesorId: string): Promise<Perfil[]> {
    if (usarSupabase()) {
      const { data, error } = await supabase.from('perfiles').select('*').eq('rol', 'estudiante').eq('profesor_id', profesorId);
      if (error) throw error;
      return data || [];
    } else {
      const perfiles = getStored<Perfil[]>('perfiles', []);
      return perfiles.filter(p => p.rol === 'estudiante' && p.profesor_id === profesorId);
    }
  },

  async getProfesores(): Promise<Perfil[]> {
    if (usarSupabase()) {
      const { data, error } = await supabase.from('perfiles').select('*').eq('rol', 'profesor');
      if (error) throw error;
      return data || [];
    } else {
      const perfiles = getStored<Perfil[]>('perfiles', []);
      return perfiles.filter(p => p.rol === 'profesor');
    }
  },

  async crearEstudiante(nombre: string, curso: string, contrasena: string, profesorId: string) {
    const email = correoInterno(nombre, curso);
    return this.signUp(email, contrasena, nombre, 'estudiante', { curso, profesor_id: profesorId });
  },

  async crearProfesor(nombre: string, email: string, contrasena: string) {
    return this.signUp(email, contrasena, nombre, 'profesor');
  },

  // --- ETAPAS ---
  async getEtapas(profesorId: string): Promise<Etapa[]> {
    if (usarSupabase()) {
      const { data, error } = await supabase.from('etapas').select('*').eq('profesor_id', profesorId).order('orden', { ascending: true });
      if (error) throw error;
      return data || [];
    } else {
      const etapas = getStored<Etapa[]>('etapas', []);
      return etapas.filter(e => e.profesor_id === profesorId).sort((a,b) => a.orden - b.orden);
    }
  },

  async crearEtapa(nombre: string, orden: number, profesorId: string) {
    if (usarSupabase()) {
      const { data, error } = await supabase.from('etapas').insert({ nombre, orden, profesor_id: profesorId }).select().single();
      if (error) throw error;
      return data;
    } else {
      const etapas = getStored<Etapa[]>('etapas', []);
      const newEtapa: Etapa = {
        id: `etapa-${Math.random().toString(36).substr(2, 9)}`,
        nombre,
        orden,
        profesor_id: profesorId,
        creado_en: new Date().toISOString()
      };
      etapas.push(newEtapa);
      setStored('etapas', etapas);
      return newEtapa;
    }
  },

  // --- ACTIVIDADES ---
  async getActividades(profesorId: string): Promise<Actividad[]> {
    if (usarSupabase()) {
      const { data, error } = await supabase.from('actividades').select('*').eq('profesor_id', profesorId);
      if (error) console.warn('Supabase fetch error, fallback to seed:', error);
      const userActs = data || [];
      // Combine user created activities + SEED_ACTIVITIES avoiding duplicates
      const userIds = new Set(userActs.map((a: Actividad) => a.id));
      const filteredSeed = SEED_ACTIVITIES.filter((a: Actividad) => !userIds.has(a.id));
      return [...userActs, ...filteredSeed];
    } else {
      const acts = getStored<Actividad[]>('actividades', []);
      const userActs = acts.filter((a: Actividad) => a.profesor_id === profesorId);
      const userIds = new Set(userActs.map((a: Actividad) => a.id));
      const filteredSeed = SEED_ACTIVITIES.filter((a: Actividad) => !userIds.has(a.id));
      return [...userActs, ...filteredSeed];
    }
  },

  async getActividad(id: string): Promise<Actividad | null> {
    if (usarSupabase()) {
      const { data } = await supabase.from('actividades').select('*').eq('id', id).single();
      if (data) return data;
      return SEED_ACTIVITIES.find(a => a.id === id) || null;
    } else {
      const acts = getStored<Actividad[]>('actividades', []);
      const found = acts.find(a => a.id === id);
      if (found) return found;
      return SEED_ACTIVITIES.find(a => a.id === id) || null;
    }
  },

  async guardarActividad(actividad: Omit<Actividad, 'id'> & { id?: string }) {
    if (usarSupabase()) {
      if (actividad.id) {
        const { data, error } = await supabase.from('actividades').update(actividad).eq('id', actividad.id).select().single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from('actividades').insert(actividad).select().single();
        if (error) throw error;
        return data;
      }
    } else {
      const acts = getStored<Actividad[]>('actividades', []);
      if (actividad.id) {
        const idx = acts.findIndex(a => a.id === actividad.id);
        if (idx !== -1) {
          acts[idx] = { ...acts[idx], ...actividad };
        }
      } else {
        const newAct = {
          ...actividad,
          id: `act-${Math.random().toString(36).substr(2, 9)}`,
          creado_en: new Date().toISOString()
        } as Actividad;
        acts.push(newAct);
        setStored('actividades', acts);
        return newAct;
      }
      setStored('actividades', acts);
      return actividad as Actividad;
    }
  },

  // --- RUTAS (ETAPAS CON PASOS LINEALES) ---

  // Pasos ordenados de una ruta (una actividad con etapa_id = un paso)
  async getPasosDeEtapa(etapaId: string): Promise<Actividad[]> {
    const pasos = await this.getActividadesDeEtapa(etapaId);
    return pasos.sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99));
  },

  async getActividadesDeEtapa(etapaId: string): Promise<Actividad[]> {
    if (usarSupabase()) {
      const { data, error } = await supabase.from('actividades').select('*').eq('etapa_id', etapaId);
      if (error) throw error;
      return data || [];
    } else {
      const acts = getStored<Actividad[]>('actividades', []);
      const userActs = acts.filter(a => a.etapa_id === etapaId);
      const userIds = new Set(userActs.map(a => a.id));
      const filteredSeed = SEED_ACTIVITIES.filter((a: Actividad) => a.etapa_id === etapaId && !userIds.has(a.id));
      return [...userActs, ...filteredSeed];
    }
  },

  // Banco de Actividades: solo plantillas individuales (sin etapa), reciclables a rutas
  async getBanco(profesorId: string): Promise<Actividad[]> {
    if (usarSupabase()) {
      const { data, error } = await supabase.from('actividades').select('*').eq('profesor_id', profesorId).is('etapa_id', null);
      if (error) throw error;
      return data || [];
    } else {
      const acts = getStored<Actividad[]>('actividades', []);
      return acts.filter(a => !a.etapa_id && a.profesor_id === profesorId);
    }
  },

  // Reciclar: COPIA una plantilla del banco como paso al final de una ruta (autocontenida)
  async reciclarARuta(actividadId: string, etapaId: string, profesorId: string): Promise<Actividad> {
    const origen = await this.getActividad(actividadId);
    if (!origen) throw new Error('La actividad de origen no existe');

    const pasos = await this.getPasosDeEtapa(etapaId);
    const nuevoOrden = pasos.length > 0 ? Math.max(...pasos.map(p => p.orden ?? 0)) + 1 : 1;

    const copia: Omit<Actividad, 'id'> = {
      profesor_id: profesorId,
      etapa_id: etapaId,
      orden: nuevoOrden,
      tipo: origen.tipo,
      titulo: origen.titulo,
      video_url: origen.video_url,
      imagen_url: origen.imagen_url,
      configuracion: JSON.parse(JSON.stringify(origen.configuracion)),
      atelier: origen.atelier ? JSON.parse(JSON.stringify(origen.atelier)) : undefined,
      creado_en: new Date().toISOString()
    };
    return this.guardarActividad(copia);
  },

  // Mover un paso arriba/abajo dentro de la ruta (direccion: 'arriba' | 'abajo')
  async moverPaso(pasoId: string, direccion: 'arriba' | 'abajo') {
    const paso = await this.getActividad(pasoId);
    if (!paso || !paso.etapa_id) throw new Error('El paso no pertenece a ninguna ruta');
    const pasos = await this.getPasosDeEtapa(paso.etapa_id);
    const idx = pasos.findIndex(p => p.id === pasoId);
    const swapIdx = direccion === 'arriba' ? idx - 1 : idx + 1;
    if (idx === -1 || swapIdx < 0 || swapIdx >= pasos.length) return;

    const a = pasos[idx], b = pasos[swapIdx];
    await this.guardarActividad({ ...a, orden: b.orden ?? swapIdx + 1 } as Actividad);
    await this.guardarActividad({ ...b, orden: a.orden ?? idx + 1 } as Actividad);
  },

  // Eliminar un paso de una ruta (solo pasos con etapa; el banco no se toca)
  async eliminarPaso(pasoId: string) {
    if (usarSupabase()) {
      const { error } = await supabase.from('actividades').delete().eq('id', pasoId);
      if (error) throw error;
    } else {
      const acts = getStored<Actividad[]>('actividades', []);
      setStored('actividades', acts.filter(a => a.id !== pasoId));
    }
  },

  // Rutas asignadas a un estudiante, con sus pasos y progreso por paso
  async getRutasAsignadas(estudianteId: string): Promise<(Asignacion & { etapa: Etapa; pasos: Actividad[] })[]> {
    let asigs: Asignacion[] = [];
    if (usarSupabase()) {
      const { data, error } = await supabase.from('asignaciones').select('*').eq('estudiante_id', estudianteId);
      if (error) throw error;
      asigs = data || [];
    } else {
      const stored = getStored<Asignacion[]>('asignaciones', []);
      asigs = stored.filter(a => a.estudiante_id === estudianteId);
    }

    const etapas = usarSupabase()
      ? await (async () => { const { data } = await supabase.from('etapas').select('*'); return (data || []) as Etapa[]; })()
      : getStored<Etapa[]>('etapas', []);

    const rutas: (Asignacion & { etapa: Etapa; pasos: Actividad[] })[] = [];
    for (const asig of asigs) {
      const etapa = etapas.find(e => e.id === asig.etapa_id);
      if (!etapa) continue;
      const pasos = await this.getPasosDeEtapa(asig.etapa_id);
      rutas.push({ ...asig, etapa, pasos });
    }
    return rutas.sort((a, b) => (a.etapa.orden ?? 0) - (b.etapa.orden ?? 0));
  },

  async asignarRuta(estudianteId: string, etapaId: string, ajuste: 'cognitiva' | 'motriz' | 'tea' | undefined) {
    if (usarSupabase()) {
      const { data, error } = await supabase.from('asignaciones').insert({ estudiante_id: estudianteId, etapa_id: etapaId, ajuste }).select().single();
      if (error) throw error;
      return data;
    } else {
      const asigs = getStored<Asignacion[]>('asignaciones', []);
      const filtered = asigs.filter(a => !(a.estudiante_id === estudianteId && a.etapa_id === etapaId));
      const newAsig: Asignacion = {
        id: `asig-${Math.random().toString(36).substr(2, 9)}`,
        estudiante_id: estudianteId,
        etapa_id: etapaId,
        ajuste,
        creado_en: new Date().toISOString()
      };
      filtered.push(newAsig);
      setStored('asignaciones', filtered);
      return newAsig;
    }
  },

  async desasignarRuta(estudianteId: string, etapaId: string) {
    if (usarSupabase()) {
      const { error } = await supabase.from('asignaciones').delete().eq('estudiante_id', estudianteId).eq('etapa_id', etapaId);
      if (error) throw error;
    } else {
      const asigs = getStored<Asignacion[]>('asignaciones', []);
      setStored('asignaciones', asigs.filter(a => !(a.estudiante_id === estudianteId && a.etapa_id === etapaId)));
    }
  },

  // --- ASIGNACIONES (LEGACY: conteos del resumen) ---

  async getAsignacionesDeProfesor(profesorId: string): Promise<Asignacion[]> {
    if (usarSupabase()) {
      // Fetch assignations where student's profesor_id is teacher
      const { data, error } = await supabase.from('asignaciones').select('*, estudiante:perfiles(*)').filter('estudiante.profesor_id', 'eq', profesorId);
      if (error) throw error;
      return data || [];
    } else {
      const asigs = getStored<Asignacion[]>('asignaciones', []);
      const perfiles = getStored<Perfil[]>('perfiles', []);
      const students = perfiles.filter(p => p.rol === 'estudiante' && p.profesor_id === profesorId).map(p => p.id);
      return asigs.filter(a => students.includes(a.estudiante_id));
    }
  },

  // --- PROGRESO ---
  async getProgresoEstudiante(estudianteId: string): Promise<Progreso[]> {
    if (usarSupabase()) {
      const { data, error } = await supabase.from('progreso').select('*').eq('estudiante_id', estudianteId);
      if (error) throw error;
      return data || [];
    } else {
      const progs = getStored<Progreso[]>('progreso', []);
      return progs.filter(p => p.estudiante_id === estudianteId);
    }
  },

  async registrarIntento(estudianteId: string, actividadId: string, completado: boolean) {
    if (usarSupabase()) {
      // Fetch existing
      const { data: existing } = await supabase.from('progreso').select('*').eq('estudiante_id', estudianteId).eq('actividad_id', actividadId).single();
      const intentos = (existing?.intentos || 0) + 1;
      const yaCompletado = existing?.completado || completado;

      const { data, error } = await supabase.from('progreso').upsert({
        estudiante_id: estudianteId,
        actividad_id: actividadId,
        completado: yaCompletado,
        intentos,
        actualizado_en: new Date().toISOString()
      }, { onConflict: 'estudiante_id,actividad_id' }).select().single();
      
      if (error) throw error;
      return data;
    } else {
      const progs = getStored<Progreso[]>('progreso', []);
      const idx = progs.findIndex(p => p.estudiante_id === estudianteId && p.actividad_id === actividadId);
      if (idx !== -1) {
        progs[idx].intentos += 1;
        if (completado) progs[idx].completado = true;
        progs[idx].actualizado_en = new Date().toISOString();
      } else {
        progs.push({
          id: `prog-${Math.random().toString(36).substr(2, 9)}`,
          estudiante_id: estudianteId,
          actividad_id: actividadId,
          completado,
          intentos: 1,
          actualizado_en: new Date().toISOString()
        });
      }
      setStored('progreso', progs);
    }
  },

  // --- RECURSOS (IMÁGENES & AUDIOS) ---
  async subirRecurso(file: File, tipo: 'imagen' | 'audio', profesorId: string): Promise<string> {
    if (usarSupabase()) {
      const bucket = tipo === 'imagen' ? 'imagenes' : 'audios';
      const fileExt = file.name.split('.').pop();
      const fileName = `${profesorId}/${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      
      // Save record in recursos table
      await supabase.from('recursos').insert({
        profesor_id: profesorId,
        url: data.publicUrl,
        tipo
      });

      return data.publicUrl;
    } else {
      // In localStorage mode, convert to base64 so it can be stored and previewed!
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // Save resource reference
          const recursos = getStored<Recurso[]>('recursos', []);
          recursos.push({
            id: `rec-${Math.random().toString(36).substr(2, 9)}`,
            profesor_id: profesorId,
            url: base64String,
            tipo,
            creado_en: new Date().toISOString()
          });
          setStored('recursos', recursos);
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  }
};
export default db;
