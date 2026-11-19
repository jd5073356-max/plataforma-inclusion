import { Etapa } from '../types/actividad';
import { correoInterno } from '../lib/db';

export interface EstudianteCSVItem {
  idTemp: string;
  nombre: string;
  curso: string;
  ajuste?: 'cognitiva' | 'motriz' | 'tea';
  rutasNombres?: string[];
  rutasIds?: string[];
  valido: boolean;
  error?: string;
  emailCalculado: string;
  seleccionado: boolean;
}

export interface ProfesorCSVItem {
  idTemp: string;
  nombre: string;
  email: string;
  contrasena: string;
  valido: boolean;
  error?: string;
  seleccionado: boolean;
}

/**
 * Normaliza encabezados quitando tildes, signos y espacios extras
 */
function normalizarTexto(t: string): string {
  return t
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Divide una línea CSV respetando comillas y delimitadores comunes (, ; \t)
 */
export function parseCSVLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let currentValue = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentValue += '"';
        i++; // saltar comilla escapada
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      values.push(currentValue.trim());
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  values.push(currentValue.trim());
  return values;
}

/**
 * Detecta automáticamente el delimitador más probable entre coma, punto y coma o tabulación
 */
export function detectarDelimitador(rawText: string): string {
  const lineas = rawText.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lineas.length === 0) return ',';

  const primera = lineas[0];
  const countComas = (primera.match(/,/g) || []).length;
  const countPuntoComas = (primera.match(/;/g) || []).length;
  const countTabs = (primera.match(/\t/g) || []).length;

  if (countTabs > countComas && countTabs > countPuntoComas) return '\t';
  if (countPuntoComas > countComas) return ';';
  return ',';
}

/**
 * Parsea el texto CSV completo a una matriz de cadenas
 */
export function parseCSV(rawText: string): string[][] {
  // Elimina UTF-8 BOM si está presente
  const clean = rawText.replace(/^\uFEFF/, '').trim();
  if (!clean) return [];

  const delimiter = detectarDelimitador(clean);
  const lineas = clean.split(/\r?\n/);
  const rows: string[][] = [];

  for (const l of lineas) {
    if (!l.trim()) continue;
    rows.push(parseCSVLine(l, delimiter));
  }
  return rows;
}

/**
 * Normaliza el ajuste de accesibilidad
 */
export function normalizarAjuste(val?: string): 'cognitiva' | 'motriz' | 'tea' | undefined {
  if (!val) return undefined;
  const norm = normalizarTexto(val);
  if (norm.includes('motr') || norm.includes('motor') || norm.includes('fisic')) return 'motriz';
  if (norm.includes('cogn') || norm.includes('intelec') || norm.includes('apren')) return 'cognitiva';
  if (norm.includes('tea') || norm.includes('autis') || norm.includes('asper')) return 'tea';
  return undefined;
}

/**
 * Parsea un CSV de estudiantes y valida fila por fila
 */
export function parseEstudiantesCSV(
  rawText: string,
  etapasDisponibles: Etapa[] = [],
  defaults: { curso?: string; ajuste?: 'cognitiva' | 'motriz' | 'tea'; rutaId?: string } = {}
): EstudianteCSVItem[] {
  const rows = parseCSV(rawText);
  if (rows.length === 0) return [];

  let headerNombreIdx = -1;
  let headerCursoIdx = -1;
  let headerAjusteIdx = -1;
  let headerRutasIdx = -1;

  const firstRow = rows[0];
  const hasHeaders = firstRow.some(col => {
    const n = normalizarTexto(col);
    return n.includes('nombre') || n.includes('estudiante') || n.includes('alumno') || n.includes('curso') || n.includes('grado');
  });

  let startIndex = 0;
  if (hasHeaders) {
    firstRow.forEach((col, idx) => {
      const n = normalizarTexto(col);
      if (headerNombreIdx === -1 && (n.includes('nombre') || n.includes('estudiante') || n.includes('alumno') || n === 'name')) {
        headerNombreIdx = idx;
      } else if (headerCursoIdx === -1 && (n.includes('curso') || n.includes('grado') || n.includes('nivel') || n.includes('seccion') || n.includes('grupo') || n === 'grade')) {
        headerCursoIdx = idx;
      } else if (headerAjusteIdx === -1 && (n.includes('ajuste') || n.includes('acces') || n.includes('piar') || n.includes('discapacidad'))) {
        headerAjusteIdx = idx;
      } else if (headerRutasIdx === -1 && (n.includes('ruta') || n.includes('etapa') || n.includes('materia') || n.includes('asignatura'))) {
        headerRutasIdx = idx;
      }
    });
    startIndex = 1;
  } else {
    // Si no tiene cabeceras, se asume col 0 = Nombre, col 1 = Curso, col 2 = Ajuste, col 3 = Rutas
    headerNombreIdx = 0;
    headerCursoIdx = firstRow.length > 1 ? 1 : -1;
    headerAjusteIdx = firstRow.length > 2 ? 2 : -1;
    headerRutasIdx = firstRow.length > 3 ? 3 : -1;
    startIndex = 0;
  }

  const items: EstudianteCSVItem[] = [];

  for (let i = startIndex; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || row.every(c => !c.trim())) continue;

    const nombreRaw = headerNombreIdx !== -1 && row[headerNombreIdx] ? row[headerNombreIdx].trim() : (row[0] || '').trim();
    let cursoRaw = headerCursoIdx !== -1 && row[headerCursoIdx] ? row[headerCursoIdx].trim() : '';
    if (!cursoRaw && defaults.curso) {
      cursoRaw = defaults.curso.trim();
    }

    const ajusteRaw = headerAjusteIdx !== -1 && row[headerAjusteIdx] ? row[headerAjusteIdx].trim() : '';
    const rutasRaw = headerRutasIdx !== -1 && row[headerRutasIdx] ? row[headerRutasIdx].trim() : '';

    const ajuste = normalizarAjuste(ajusteRaw) || defaults.ajuste;

    // Vincular rutas por nombre o id
    const rutasIds: string[] = [];
    const rutasNombres: string[] = [];

    if (rutasRaw) {
      const candidatas = rutasRaw.split(/[,|;/]/).map(r => r.trim()).filter(Boolean);
      for (const cand of candidatas) {
        const etapa = etapasDisponibles.find(
          e => e.id === cand || normalizarTexto(e.nombre) === normalizarTexto(cand) || normalizarTexto(e.nombre).includes(normalizarTexto(cand))
        );
        if (etapa && !rutasIds.includes(etapa.id)) {
          rutasIds.push(etapa.id);
          rutasNombres.push(etapa.nombre);
        } else if (!etapa) {
          rutasNombres.push(cand);
        }
      }
    }

    // Si hay ruta por defecto y no se asignó ninguna específica
    if (defaults.rutaId && !rutasIds.includes(defaults.rutaId)) {
      const etapaDef = etapasDisponibles.find(e => e.id === defaults.rutaId);
      if (etapaDef) {
        rutasIds.push(etapaDef.id);
        rutasNombres.push(etapaDef.nombre);
      }
    }

    let error: string | undefined;
    if (!nombreRaw) {
      error = 'Falta el nombre del estudiante';
    } else if (!cursoRaw) {
      error = 'Falta el curso o nivel (asigna uno o defínelo en el CSV)';
    } else if (nombreRaw.length < 3) {
      error = 'El nombre es muy corto';
    }

    const valido = !error;
    const emailCalculado = nombreRaw && cursoRaw ? correoInterno(nombreRaw, cursoRaw) : '';

    items.push({
      idTemp: `csv-row-${i}-${Math.random().toString(36).substring(2, 7)}`,
      nombre: nombreRaw,
      curso: cursoRaw,
      ajuste,
      rutasNombres,
      rutasIds,
      valido,
      error,
      emailCalculado,
      seleccionado: valido
    });
  }

  return items;
}

/**
 * Parsea un CSV de profesores para el panel de administración
 */
export function parseProfesoresCSV(rawText: string): ProfesorCSVItem[] {
  const rows = parseCSV(rawText);
  if (rows.length === 0) return [];

  let headerNombreIdx = -1;
  let headerEmailIdx = -1;
  let headerPassIdx = -1;

  const firstRow = rows[0];
  const hasHeaders = firstRow.some(col => {
    const n = normalizarTexto(col);
    return n.includes('nombre') || n.includes('email') || n.includes('correo') || n.includes('profesor');
  });

  let startIndex = 0;
  if (hasHeaders) {
    firstRow.forEach((col, idx) => {
      const n = normalizarTexto(col);
      if (headerNombreIdx === -1 && (n.includes('nombre') || n.includes('profesor') || n.includes('docente') || n === 'name')) {
        headerNombreIdx = idx;
      } else if (headerEmailIdx === -1 && (n.includes('email') || n.includes('correo') || n.includes('mail'))) {
        headerEmailIdx = idx;
      } else if (headerPassIdx === -1 && (n.includes('pass') || n.includes('contra') || n.includes('clave'))) {
        headerPassIdx = idx;
      }
    });
    startIndex = 1;
  } else {
    headerNombreIdx = 0;
    headerEmailIdx = firstRow.length > 1 ? 1 : -1;
    headerPassIdx = firstRow.length > 2 ? 2 : -1;
    startIndex = 0;
  }

  const items: ProfesorCSVItem[] = [];

  for (let i = startIndex; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || row.every(c => !c.trim())) continue;

    const nombre = headerNombreIdx !== -1 && row[headerNombreIdx] ? row[headerNombreIdx].trim() : (row[0] || '').trim();
    const email = headerEmailIdx !== -1 && row[headerEmailIdx] ? row[headerEmailIdx].trim().toLowerCase() : (row[1] || '').trim().toLowerCase();
    const pass = headerPassIdx !== -1 && row[headerPassIdx] ? row[headerPassIdx].trim() : (row[2] || 'Profesor2026*').trim();

    let error: string | undefined;
    if (!nombre) {
      error = 'Falta el nombre del profesor';
    } else if (!email || !email.includes('@')) {
      error = 'Email inválido o ausente';
    } else if (pass.length < 6) {
      error = 'La contraseña debe tener mínimo 6 caracteres';
    }

    const valido = !error;

    items.push({
      idTemp: `csv-prof-${i}-${Math.random().toString(36).substring(2, 7)}`,
      nombre,
      email,
      contrasena: pass || 'Profesor2026*',
      valido,
      error,
      seleccionado: valido
    });
  }

  return items;
}

/**
 * Descarga archivo con BOM UTF-8 para garantizar apertura perfecta en Excel
 */
function triggerDescarga(nombreArchivo: string, contenido: string, mime = 'text/csv;charset=utf-8;') {
  const blob = new Blob(['\uFEFF' + contenido], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Descarga plantilla CSV de ejemplo para estudiantes
 */
export function descargarPlantillaEstudiantesCSV(nombreRutaEjemplo = 'Biología 901') {
  const encabezado = 'Nombre Completo,Curso,Ajuste de Accesibilidad,Ruta Asignada';
  const filas = [
    `María Paula Peñuela,901,motriz,${nombreRutaEjemplo}`,
    'Carlos Eduardo Gómez,802,cognitiva,',
    'Laura Sofía Ramírez,901,tea,',
    'Andrés Felipe Torres,703,ninguno,'
  ];
  const csv = [encabezado, ...filas].join('\r\n');
  triggerDescarga('plantilla_estudiantes_ecoinclusivo.csv', csv);
}

/**
 * Descarga plantilla CSV de ejemplo para profesores
 */
export function descargarPlantillaProfesoresCSV() {
  const encabezado = 'Nombre Completo,Correo Institucional,Contraseña';
  const filas = [
    'Rafael Suárez Martínez,rafael@ecoinclusivo.edu.co,Profesor2026*',
    'Claudia Patricia Méndez,claudia@ecoinclusivo.edu.co,Docente2026*'
  ];
  const csv = [encabezado, ...filas].join('\r\n');
  triggerDescarga('plantilla_profesores_ecoinclusivo.csv', csv);
}
