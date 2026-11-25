import { Etapa } from '../types/actividad';
import { correoInterno } from '../lib/db';
import {
  descargarWorkbookXlsx,
  leerWorkbookXlsx,
  decodificarTextoCSV,
  esBufferZipXlsx
} from './xlsxHelper';

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
  if (lineas.length === 0) return ';';

  const primera = lineas[0];
  const countComas = (primera.match(/,/g) || []).length;
  const countPuntoComas = (primera.match(/;/g) || []).length;
  const countTabs = (primera.match(/\t/g) || []).length;

  if (countTabs > countComas && countTabs > countPuntoComas) return '\t';
  if (countPuntoComas >= countComas && countPuntoComas > 0) return ';';
  return ',';
}

/**
 * Parsea el texto CSV completo a una matriz de cadenas
 */
export function parseCSV(rawText: string): string[][] {
  // Elimina UTF-8 BOM si está presente
  const clean = rawText.replace(/^\uFEFF/, '').trim();
  if (!clean) return [];

  const lineas = clean.split(/\r?\n/);
  let delimiter = '';
  let inicio = 0;

  if (lineas[0] && /^sep=(.|\\t)\s*$/i.test(lineas[0].trim())) {
    const m = lineas[0].trim().slice(4);
    delimiter = m === '\\t' ? '\t' : m;
    inicio = 1;
  } else {
    delimiter = detectarDelimitador(clean);
  }

  const rows: string[][] = [];
  for (let i = inicio; i < lineas.length; i++) {
    const l = lineas[i];
    if (!l || !l.trim() || l.trim().startsWith('#')) continue;
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
  if (!norm || norm === 'ninguno' || norm === 'no' || norm === 'na') return undefined;
  if (norm.includes('motr') || norm.includes('motor') || norm.includes('fisic')) return 'motriz';
  if (norm.includes('cogn') || norm.includes('intelec') || norm.includes('apren')) return 'cognitiva';
  if (norm.includes('tea') || norm.includes('autis') || norm.includes('asper')) return 'tea';
  return undefined;
}

/**
 * Convierte una matriz de celdas (de Excel o CSV) en ítems validados de estudiantes
 */
export function parseEstudiantesFilas(
  rows: string[][],
  etapasDisponibles: Etapa[] = [],
  defaults: { curso?: string; ajuste?: 'cognitiva' | 'motriz' | 'tea'; rutaId?: string } = {}
): EstudianteCSVItem[] {
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
      } else if (headerAjusteIdx === -1 && (n.includes('apoyo') || n.includes('ajuste') || n.includes('adaptacion') || n.includes('acces') || n.includes('piar') || n.includes('discapacidad'))) {
        headerAjusteIdx = idx;
      } else if (headerRutasIdx === -1 && (n.includes('ruta') || n.includes('etapa') || n.includes('materia') || n.includes('asignatura'))) {
        headerRutasIdx = idx;
      }
    });
    startIndex = 1;
  } else {
    headerNombreIdx = 0;
    headerCursoIdx = firstRow.length > 1 ? 1 : -1;
    headerAjusteIdx = firstRow.length > 2 ? 2 : -1;
    headerRutasIdx = firstRow.length > 3 ? 3 : -1;
    startIndex = 0;
  }

  const items: EstudianteCSVItem[] = [];

  for (let i = startIndex; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || row.every(c => !c || !c.trim())) continue;

    const nombreRaw = headerNombreIdx !== -1 && row[headerNombreIdx] ? row[headerNombreIdx].trim() : (row[0] || '').trim();
    if (nombreRaw.startsWith('#') || /^ejemplo\s*:/i.test(nombreRaw)) continue;

    let cursoRaw = headerCursoIdx !== -1 && row[headerCursoIdx] ? row[headerCursoIdx].trim() : '';
    if (!cursoRaw && defaults.curso) {
      cursoRaw = defaults.curso.trim();
    }

    const ajusteRaw = headerAjusteIdx !== -1 && row[headerAjusteIdx] ? row[headerAjusteIdx].trim() : '';
    const rutasRaw = headerRutasIdx !== -1 && row[headerRutasIdx] ? row[headerRutasIdx].trim() : '';

    const ajuste = normalizarAjuste(ajusteRaw) || defaults.ajuste;

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
      error = 'Falta el curso (escríbelo en la columna Curso o en «Curso por defecto»)';
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
 * Parsea un CSV de estudiantes y valida fila por fila
 */
export function parseEstudiantesCSV(
  rawText: string,
  etapasDisponibles: Etapa[] = [],
  defaults: { curso?: string; ajuste?: 'cognitiva' | 'motriz' | 'tea'; rutaId?: string } = {}
): EstudianteCSVItem[] {
  const rows = parseCSV(rawText);
  return parseEstudiantesFilas(rows, etapasDisponibles, defaults);
}

/**
 * Lee un archivo subido (.xlsx de Excel o .csv/.txt) y extrae la matriz cruda de filas
 */
export async function extraerFilasDesdeArchivo(file: File): Promise<string[][]> {
  const buffer = await file.arrayBuffer();
  if (file.name.toLowerCase().endsWith('.xlsx') || esBufferZipXlsx(buffer)) {
    return leerWorkbookXlsx(buffer);
  }
  const texto = decodificarTextoCSV(buffer);
  return parseCSV(texto);
}

/**
 * Convierte una matriz de celdas en ítems validados de profesores
 */
export function parseProfesoresFilas(rows: string[][]): ProfesorCSVItem[] {
  if (rows.length === 0) return [];

  let headerNombreIdx = -1;
  let headerEmailIdx = -1;
  let headerPassIdx = -1;

  const firstRow = rows[0];
  const hasHeaders = firstRow.some(col => {
    const n = normalizarTexto(col);
    return n.includes('nombre') || n.includes('email') || n.includes('correo') || n.includes('profesor') || n.includes('usuario');
  });

  let startIndex = 0;
  if (hasHeaders) {
    firstRow.forEach((col, idx) => {
      const n = normalizarTexto(col);
      if (headerNombreIdx === -1 && (n.includes('nombre') || n.includes('profesor') || n.includes('docente') || n === 'name')) {
        headerNombreIdx = idx;
      } else if (headerEmailIdx === -1 && (n.includes('email') || n.includes('correo') || n.includes('mail') || n.includes('usuario'))) {
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
    if (row.length === 0 || row.every(c => !c || !c.trim())) continue;

    const nombre = headerNombreIdx !== -1 && row[headerNombreIdx] ? row[headerNombreIdx].trim() : (row[0] || '').trim();
    const email = headerEmailIdx !== -1 && row[headerEmailIdx] ? row[headerEmailIdx].trim().toLowerCase() : (row[1] || '').trim().toLowerCase();
    const pass = headerPassIdx !== -1 && row[headerPassIdx] ? row[headerPassIdx].trim() : (row[2] || 'Profesor2026*').trim();

    let error: string | undefined;
    if (!nombre) {
      error = 'Falta el nombre del profesor';
    } else if (!email || !email.includes('@')) {
      error = 'Correo inválido o ausente';
    } else if (pass.length < 6) {
      error = 'La clave debe tener mínimo 6 caracteres';
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
 * Parsea un CSV de profesores para el panel de administración
 */
export function parseProfesoresCSV(rawText: string): ProfesorCSVItem[] {
  const rows = parseCSV(rawText);
  return parseProfesoresFilas(rows);
}

/**
 * Descarga archivo CSV con BOM UTF-8 y punto y coma (;) para apertura limpia por columnas en Excel en español
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
 * Descarga plantilla nativa de Excel (.xlsx) para estudiantes — abre directo en columnas limpias
 */
export function descargarPlantillaEstudiantesExcel() {
  const filas = [
    ['Nombre del Estudiante', 'Curso', 'Apoyo Opcional (motriz, cognitiva o tea)'],
    ['María Paula Peñuela', '901', 'motriz'],
    ['Carlos Eduardo Gómez', '802', 'cognitiva'],
    ['Laura Sofía Ramírez', '901', '']
  ];
  descargarWorkbookXlsx('Plantilla_Estudiantes_EcoInclusivo.xlsx', 'Estudiantes', filas, [36, 16, 40]);
}

/**
 * Descarga plantilla CSV para estudiantes separada por punto y coma (;) compatible con Excel en español
 */
export function descargarPlantillaEstudiantesCSV() {
  const encabezado = 'Nombre del Estudiante;Curso;Apoyo Opcional (motriz, cognitiva o tea)';
  const filas = [
    'María Paula Peñuela;901;motriz',
    'Carlos Eduardo Gómez;802;cognitiva',
    'Laura Sofía Ramírez;901;'
  ];
  const csv = [encabezado, ...filas].join('\r\n');
  triggerDescarga('Plantilla_Estudiantes_EcoInclusivo.csv', csv);
}

/**
 * Descarga plantilla nativa de Excel (.xlsx) para profesores
 */
export function descargarPlantillaProfesoresExcel() {
  const filas = [
    ['Nombre del Profesor', 'Correo Institucional', 'Clave Asignada'],
    ['Claudia Patricia Méndez', 'claudia@institucion.edu.co', 'Docente2026*'],
    ['Andrés Felipe Torres', 'andres@institucion.edu.co', 'Docente2026*']
  ];
  descargarWorkbookXlsx('Plantilla_Profesores_EcoInclusivo.xlsx', 'Profesores', filas, [34, 34, 22]);
}

/**
 * Descarga plantilla CSV para profesores separada por punto y coma (;) compatible con Excel en español
 */
export function descargarPlantillaProfesoresCSV() {
  const encabezado = 'Nombre del Profesor;Correo Institucional;Clave Asignada';
  const filas = [
    'Claudia Patricia Méndez;claudia@institucion.edu.co;Docente2026*',
    'Andrés Felipe Torres;andres@institucion.edu.co;Docente2026*'
  ];
  const csv = [encabezado, ...filas].join('\r\n');
  triggerDescarga('Plantilla_Profesores_EcoInclusivo.csv', csv);
}
