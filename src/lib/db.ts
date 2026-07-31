import { supabase, isSupabaseConfigured } from './supabase';
import { Actividad, ActividadTipo, Perfil, Etapa, Asignacion, Progreso, Recurso } from '../types/actividad';

// Helper for generating student emails internally
export function correoInterno(nombre: string, curso: string): string {
  const limpio = (t: string) =>
    t.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `${limpio(nombre)}.${limpio(curso)}@inclusion.local`;
}

// Initial mock data if localStorage is empty
const MOCK_PROFILES: Perfil[] = [
  { id: 'profesor-1', rol: 'profesor', nombre: 'Profesor Juan', curso: 'General' },
  { id: 'estudiante-1', rol: 'estudiante', nombre: 'Ana López', curso: '3A', profesor_id: 'profesor-1' },
  { id: 'estudiante-2', rol: 'estudiante', nombre: 'Mateo Gómez', curso: '4B', profesor_id: 'profesor-1' },
  { id: 'admin-1', rol: 'admin', nombre: 'Admin Sistema' }
];

const MOCK_ETAPAS: Etapa[] = [
  { id: 'etapa-1', nombre: 'Etapa 1: Colores y Figuras', orden: 1, profesor_id: 'profesor-1' },
  { id: 'etapa-2', nombre: 'Etapa 2: Palabras y Números', orden: 2, profesor_id: 'profesor-1' }
];

const MOCK_ACTIVIDADES: Actividad[] = [
  {
    id: 'act-1',
    profesor_id: 'profesor-1',
    etapa_id: 'etapa-1',
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
    etapa_id: 'etapa-1',
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
    etapa_id: 'etapa-1',
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
    etapa_id: 'etapa-2',
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
    etapa_id: 'etapa-1',
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
  { id: 'asig-1', estudiante_id: 'estudiante-1', actividad_id: 'act-1', ajuste: 'cognitiva' },
  { id: 'asig-2', estudiante_id: 'estudiante-1', actividad_id: 'act-2', ajuste: 'cognitiva' },
  { id: 'asig-3', estudiante_id: 'estudiante-1', actividad_id: 'act-3', ajuste: 'cognitiva' },
  { id: 'asig-4', estudiante_id: 'estudiante-2', actividad_id: 'act-1', ajuste: 'tea' },
  { id: 'asig-5', estudiante_id: 'estudiante-2', actividad_id: 'act-4', ajuste: 'motriz' }
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

// Central database controller
export const db = {
  // --- AUTH ---
  async signUp(email: string, pass: string, name: string, rol: 'admin'|'profesor'|'estudiante', extra: any = {}) {
    if (isSupabaseConfigured) {
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
    if (isSupabaseConfigured) {
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
        } else if (email === 'profesor@inclusion.com' && pass === '123456') {
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
    if (isSupabaseConfigured) {
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
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    } else {
      setStored('currentUser', null);
    }
  },

  // --- PERFILES & ESTUDIANTES ---
  async getEstudiantesPorProfesor(profesorId: string): Promise<Perfil[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('perfiles').select('*').eq('rol', 'estudiante').eq('profesor_id', profesorId);
      if (error) throw error;
      return data || [];
    } else {
      const perfiles = getStored<Perfil[]>('perfiles', []);
      return perfiles.filter(p => p.rol === 'estudiante' && p.profesor_id === profesorId);
    }
  },

  async getProfesores(): Promise<Perfil[]> {
    if (isSupabaseConfigured) {
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
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('etapas').select('*').eq('profesor_id', profesorId).order('orden', { ascending: true });
      if (error) throw error;
      return data || [];
    } else {
      const etapas = getStored<Etapa[]>('etapas', []);
      return etapas.filter(e => e.profesor_id === profesorId).sort((a,b) => a.orden - b.orden);
    }
  },

  async crearEtapa(nombre: string, orden: number, profesorId: string) {
    if (isSupabaseConfigured) {
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
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('actividades').select('*').eq('profesor_id', profesorId);
      if (error) throw error;
      return data || [];
    } else {
      const acts = getStored<Actividad[]>('actividades', []);
      return acts.filter(a => a.profesor_id === profesorId);
    }
  },

  async getActividad(id: string): Promise<Actividad | null> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('actividades').select('*').eq('id', id).single();
      if (error) return null;
      return data;
    } else {
      const acts = getStored<Actividad[]>('actividades', []);
      return acts.find(a => a.id === id) || null;
    }
  },

  async guardarActividad(actividad: Omit<Actividad, 'id'> & { id?: string }) {
    if (isSupabaseConfigured) {
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

  // --- ASIGNACIONES ---
  async getAsignacionesPorEstudiante(estudianteId: string): Promise<(Asignacion & { actividad: Actividad })[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('asignaciones').select('*, actividad:actividades(*)').eq('estudiante_id', estudianteId);
      if (error) throw error;
      return data || [];
    } else {
      const asigs = getStored<Asignacion[]>('asignaciones', []);
      const acts = getStored<Actividad[]>('actividades', []);
      const userAsigs = asigs.filter(a => a.estudiante_id === estudianteId);
      return userAsigs.map(asig => {
        const act = acts.find(a => a.id === asig.actividad_id)!;
        return { ...asig, actividad: act };
      }).filter(a => a.actividad !== undefined);
    }
  },

  async getAsignacionesDeProfesor(profesorId: string): Promise<Asignacion[]> {
    if (isSupabaseConfigured) {
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

  async asignarActividad(estudianteId: string, actividadId: string, ajuste: 'cognitiva'|'motriz'|'tea'|undefined) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('asignaciones').insert({ estudiante_id: estudianteId, actividad_id: actividadId, ajuste }).select().single();
      if (error) throw error;
      return data;
    } else {
      const asigs = getStored<Asignacion[]>('asignaciones', []);
      
      // Remove previous assignment of same activity to same student if exists
      const filtered = asigs.filter(a => !(a.estudiante_id === estudianteId && a.actividad_id === actividadId));
      
      const newAsig: Asignacion = {
        id: `asig-${Math.random().toString(36).substr(2, 9)}`,
        estudiante_id: estudianteId,
        actividad_id: actividadId,
        ajuste,
        creado_en: new Date().toISOString()
      };
      filtered.push(newAsig);
      setStored('asignaciones', filtered);
      return newAsig;
    }
  },

  async desasignarActividad(estudianteId: string, actividadId: string) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('asignaciones').delete().eq('estudiante_id', estudianteId).eq('actividad_id', actividadId);
      if (error) throw error;
    } else {
      const asigs = getStored<Asignacion[]>('asignaciones', []);
      const filtered = asigs.filter(a => !(a.estudiante_id === estudianteId && a.actividad_id === actividadId));
      setStored('asignaciones', filtered);
    }
  },

  // --- PROGRESO ---
  async getProgresoEstudiante(estudianteId: string): Promise<Progreso[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('progreso').select('*').eq('estudiante_id', estudianteId);
      if (error) throw error;
      return data || [];
    } else {
      const progs = getStored<Progreso[]>('progreso', []);
      return progs.filter(p => p.estudiante_id === estudianteId);
    }
  },

  async registrarIntento(estudianteId: string, actividadId: string, completado: boolean) {
    if (isSupabaseConfigured) {
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
    if (isSupabaseConfigured) {
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
