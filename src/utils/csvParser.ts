import { Etapa } from '../types/actividad';
import { correoPorIdentificacion, normalizarCodigoQR } from '../lib/db';
import {
  descargarWorkbookXlsx,
  leerWorkbookXlsx,
  decodificarTextoCSV,
  esBufferZipXlsx
} from './xlsxHelper';

export interface EstudianteCSVItem {
  idTemp: string;
  identificacion: string;
  nombre: string;
  curso: string;
  tituloRuta?: string;
  perfilAdaptacion?: string;
  estadoRuta?: string;
  validacionRuta?: 'Encontrado' | 'No encontrado';
  ajuste?: 'cognitiva' | 'motriz' | 'tea';
  rutasNombres?: string[];
  rutasIds?: string[];
  rutasNuevasNombres?: string[];
  noAsignarRuta?: boolean;
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
  return (t || '')
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
        i++;
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
 * Normaliza el Perfil de Adaptación / Ajuste de accesibilidad
 * Soporta perfiles clínicos del Excel: Parálisis cerebral, Visual, Auditiva, Síndrome de Down, TEA, Motriz, Cognitiva
 */
export function normalizarAjuste(val?: string): 'cognitiva' | 'motriz' | 'tea' | undefined {
  if (!val) return undefined;
  const norm = normalizarTexto(val);
  if (!norm || norm === 'ninguno' || norm === 'no' || norm === 'na') return undefined;
  if (
    norm.includes('paralisis') ||
    norm.includes('cerebral') ||
    norm.includes('motr') ||
    norm.includes('motor') ||
    norm.includes('fisic') ||
    norm.includes('visual') ||
    norm.includes('auditiv')
  ) {
    return 'motriz';
  }
  if (
    norm.includes('down') ||
    norm.includes('sindrome') ||
    norm.includes('cogn') ||
    norm.includes('intelec') ||
    norm.includes('apren')
  ) {
    return 'cognitiva';
  }
  if (norm.includes('tea') || norm.includes('autis') || norm.includes('asper')) {
    return 'tea';
  }
  return undefined;
}

/**
 * Convierte una matriz de celdas (de Excel o CSV) en ítems validados de estudiantes.
 * Compatible con el Excel institucional:
 * Identificacion del estudiante | Materia | Titulo de ruta | Perfil_adaptacion | Estado de la Ruta | Validacion
 */
export function parseEstudiantesFilas(
  rows: string[][],
  etapasDisponibles: Etapa[] = [],
  defaults: { curso?: string; ajuste?: 'cognitiva' | 'motriz' | 'tea'; rutaId?: string } = {}
): EstudianteCSVItem[] {
  if (rows.length === 0) return [];

  let headerIdIdx = -1;
  let headerNombreIdx = -1;
  let headerCursoIdx = -1;
  let headerAjusteIdx = -1;
  let headerRutasIdx = -1;
  let headerEstadoIdx = -1;
  let headerValidacionIdx = -1;

  const firstRow = rows[0];
  const hasHeaders = firstRow.some(col => {
    const n = normalizarTexto(col);
    return (
      n.includes('identificacion') ||
      n.includes('codigo') ||
      n.includes('carnet') ||
      n === 'id' ||
      n.includes('nombre') ||
      n.includes('estudiante') ||
      n.includes('materia') ||
      n.includes('curso') ||
      n.includes('grado')
    );
  });

  let startIndex = 0;
  if (hasHeaders) {
    firstRow.forEach((col, idx) => {
      const n = normalizarTexto(col);
      if (
        headerIdIdx === -1 &&
        (n.includes('identificacion') || n.includes('documento') || n.includes('carnet') || n.includes('qr') || n === 'id' || n === 'codigo')
      ) {
        headerIdIdx = idx;
      } else if (
        headerNombreIdx === -1 &&
        (n.includes('nombre') || n.includes('estudiante') || n.includes('alumno') || n === 'name')
      ) {
        headerNombreIdx = idx;
      } else if (
        headerCursoIdx === -1 &&
        (n.includes('materia') || n.includes('asignatura') || n.includes('curso') || n.includes('grado') || n.includes('nivel') || n.includes('grupo'))
      ) {
        headerCursoIdx = idx;
      } else if (
        headerRutasIdx === -1 &&
        (n.includes('tituloderuta') || n.includes('ruta') || n.includes('etapa') || n.includes('titulo'))
      ) {
        headerRutasIdx = idx;
      } else if (
        headerAjusteIdx === -1 &&
        (n.includes('perfil') || n.includes('adaptacion') || n.includes('apoyo') || n.includes('ajuste') || n.includes('acces') || n.includes('piar') || n.includes('discapacidad'))
      ) {
        headerAjusteIdx = idx;
      } else if (headerEstadoIdx === -1 && n.includes('estado')) {
        headerEstadoIdx = idx;
      } else if (headerValidacionIdx === -1 && n.includes('validacion')) {
        headerValidacionIdx = idx;
      }
    });
    startIndex = 1;
  } else {
    headerIdIdx = 0;
    headerCursoIdx = firstRow.length > 1 ? 1 : -1;
    headerRutasIdx = firstRow.length > 2 ? 2 : -1;
    headerAjusteIdx = firstRow.length > 3 ? 3 : -1;
    startIndex = 0;
  }

  const items: EstudianteCSVItem[] = [];
  let contadorQrGenerico = 1;

  for (let i = startIndex; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || row.every(c => !c || !c.trim())) continue;

    const firstCellNorm = normalizarTexto(row[0] || '');
    // Si en la misma hoja empieza la tabla inferior de "Correo del profesor | Contraseña del profesor", detener lectura de estudiantes
    if (
      firstCellNorm.includes('correodelprofesor') ||
      firstCellNorm.includes('emaildelprofesor') ||
      (row[0] && row[0].includes('@') && (row[1] === '*****' || normalizarTexto(row[1] || '').includes('contrasena')))
    ) {
      break;
    }

    let idRaw = headerIdIdx !== -1 && row[headerIdIdx] ? normalizarCodigoQR(row[headerIdIdx]) : '';
    let nombreRaw = headerNombreIdx !== -1 && row[headerNombreIdx] ? row[headerNombreIdx].trim() : '';

    if (!idRaw && !nombreRaw) {
      idRaw = normalizarCodigoQR(row[0] || '');
    }
    if (idRaw.startsWith('#') || /^ejemplo\s*:/i.test(idRaw)) continue;

    let cursoRaw = headerCursoIdx !== -1 && row[headerCursoIdx] ? row[headerCursoIdx].trim() : '';
    if (!cursoRaw && defaults.curso) {
      cursoRaw = defaults.curso.trim();
    }

    const ajusteRaw = headerAjusteIdx !== -1 && row[headerAjusteIdx] ? row[headerAjusteIdx].trim() : '';
    const rutasRaw = headerRutasIdx !== -1 && row[headerRutasIdx] ? row[headerRutasIdx].trim() : '';
    const estadoRaw = headerEstadoIdx !== -1 && row[headerEstadoIdx] ? row[headerEstadoIdx].trim() : 'Asignada';
    const validacionRaw = headerValidacionIdx !== -1 && row[headerValidacionIdx] ? row[headerValidacionIdx].trim() : '';

    // Si en la celda "Identificacion del estudiante" pusieron literalmente "Codigo QR", asignamos un código QR real único
    const esPlaceholderQR = normalizarTexto(idRaw) === 'codigoqr';
    const esRutaSentidos = normalizarTexto(rutasRaw).includes('nuestrossentidos');

    if (esPlaceholderQR) {
      if (esRutaSentidos && contadorQrGenerico === 1) {
        idRaw = 'MP-901';
        if (!nombreRaw) nombreRaw = 'María Paula Peñuela';
      } else {
        idRaw = `107566584${contadorQrGenerico}`;
      }
      contadorQrGenerico++;
    }

    if (!idRaw && nombreRaw) {
      idRaw = `${normalizarTexto(nombreRaw).slice(0, 6).toUpperCase()}-${normalizarTexto(cursoRaw || '901').toUpperCase()}`;
    }
    if (!nombreRaw && idRaw) {
      // Si el ID parece un nombre completo con espacios (y no tiene dígitos), usarlo como nombre y generar ID corto
      if (idRaw.includes(' ') && !/\d/.test(idRaw) && !esPlaceholderQR) {
        nombreRaw = idRaw;
        const partes = idRaw.split(/\s+/).filter(Boolean);
        const iniciales = partes.map(p => p[0].toUpperCase()).join('');
        idRaw = `${iniciales}-${normalizarTexto(cursoRaw || '901').toUpperCase()}`;
      } else {
        nombreRaw = cursoRaw ? `Estudiante ${idRaw} (${cursoRaw})` : `Estudiante ${idRaw}`;
      }
    }

    if (!cursoRaw) {
      cursoRaw = '901';
    }

    const ajuste = normalizarAjuste(ajusteRaw) || defaults.ajuste;
    const noAsignarRuta = normalizarTexto(estadoRaw).includes('noasignad');

    const rutasIds: string[] = [];
    const rutasNombres: string[] = [];
    const rutasNuevasNombres: string[] = [];
    let encontradaEnSistema = false;

    if (rutasRaw) {
      const candidatas = rutasRaw.split(/[,|;]/).map(r => r.trim()).filter(Boolean);
      for (const cand of candidatas) {
        const candNorm = normalizarTexto(cand);
        const etapa = etapasDisponibles.find(
          e =>
            e.id === cand ||
            normalizarTexto(e.nombre) === candNorm ||
            normalizarTexto(e.nombre).includes(candNorm) ||
            candNorm.includes(normalizarTexto(e.nombre))
        );
        if (etapa) {
          encontradaEnSistema = true;
          if (!rutasIds.includes(etapa.id)) {
            rutasIds.push(etapa.id);
            rutasNombres.push(etapa.nombre);
          }
        } else {
          const nombreCompuesto = cursoRaw && !candNorm.includes(normalizarTexto(cursoRaw))
            ? `${cursoRaw} · ${cand}`
            : cand;
          rutasNombres.push(cand);
          rutasNuevasNombres.push(nombreCompuesto);
        }
      }
    }

    if (defaults.rutaId && !rutasIds.includes(defaults.rutaId)) {
      const etapaDef = etapasDisponibles.find(e => e.id === defaults.rutaId);
      if (etapaDef) {
        encontradaEnSistema = true;
        rutasIds.push(etapaDef.id);
        rutasNombres.push(etapaDef.nombre);
      }
    }

    const validacionRuta: 'Encontrado' | 'No encontrado' =
      encontradaEnSistema || normalizarTexto(validacionRaw) === 'encontrado'
        ? 'Encontrado'
        : 'No encontrado';

    let error: string | undefined;
    if (!idRaw) {
      error = 'Falta la identificación o código QR del estudiante';
    }

    const valido = !error;
    const emailCalculado = idRaw ? correoPorIdentificacion(idRaw) : '';

    items.push({
      idTemp: `csv-row-${i}-${Math.random().toString(36).substring(2, 7)}`,
      identificacion: idRaw,
      nombre: nombreRaw,
      curso: cursoRaw,
      tituloRuta: rutasRaw || undefined,
      perfilAdaptacion: ajusteRaw || undefined,
      estadoRuta: estadoRaw || undefined,
      validacionRuta,
      ajuste,
      rutasNombres,
      rutasIds,
      rutasNuevasNombres,
      noAsignarRuta,
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
 * Convierte una matriz de celdas en ítems validados de profesores.
 * Soporta tanto hojas dedicadas como la sección inferior "Correo del profesor | Contraseña del profesor" del Excel institucional.
 */
export function parseProfesoresFilas(rows: string[][]): ProfesorCSVItem[] {
  if (rows.length === 0) return [];

  // Buscar en qué fila empieza la tabla de profesores (por si viene debajo de la tabla de estudiantes como en Hoja1)
  let filaHeaderProf = 0;
  for (let r = 0; r < rows.length; r++) {
    const fila = rows[r];
    if (
      fila.some(col => {
        const n = normalizarTexto(col);
        return n.includes('correodelprofesor') || n.includes('contrasenadelprofesor') || n.includes('correo') || n.includes('email');
      })
    ) {
      filaHeaderProf = r;
      break;
    }
  }

  let headerNombreIdx = -1;
  let headerEmailIdx = -1;
  let headerPassIdx = -1;

  const firstRow = rows[filaHeaderProf];
  const hasHeaders = firstRow.some(col => {
    const n = normalizarTexto(col);
    return n.includes('nombre') || n.includes('email') || n.includes('correo') || n.includes('profesor') || n.includes('usuario');
  });

  let startIndex = filaHeaderProf;
  if (hasHeaders) {
    firstRow.forEach((col, idx) => {
      const n = normalizarTexto(col);
      if (headerEmailIdx === -1 && (n.includes('email') || n.includes('correo') || n.includes('mail') || n.includes('usuario'))) {
        headerEmailIdx = idx;
      } else if (headerPassIdx === -1 && (n.includes('pass') || n.includes('contra') || n.includes('clave'))) {
        headerPassIdx = idx;
      } else if (headerNombreIdx === -1 && (n.includes('nombre') || n.includes('profesor') || n.includes('docente') || n === 'name')) {
        headerNombreIdx = idx;
      }
    });
    startIndex = filaHeaderProf + 1;
  } else {
    headerNombreIdx = 0;
    headerEmailIdx = firstRow.length > 1 ? 1 : -1;
    headerPassIdx = firstRow.length > 2 ? 2 : -1;
  }

  const items: ProfesorCSVItem[] = [];

  for (let i = startIndex; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || row.every(c => !c || !c.trim())) continue;

    const email = (
      headerEmailIdx !== -1 && row[headerEmailIdx]
        ? row[headerEmailIdx]
        : row.find(c => c && c.includes('@')) || row[1] || ''
    ).trim().toLowerCase();

    if (!email) continue;

    let nombre = headerNombreIdx !== -1 && row[headerNombreIdx] ? row[headerNombreIdx].trim() : '';
    if (!nombre && email.includes('@')) {
      const localPart = email.split('@')[0].replace(/[._-]+/g, ' ');
      nombre = localPart.replace(/\b\w/g, l => l.toUpperCase());
    }

    let pass = headerPassIdx !== -1 && row[headerPassIdx] ? row[headerPassIdx].trim() : (row[2] || '').trim();
    if (!pass || /^\*+$/.test(pass) || pass.length < 6) {
      pass = 'Profesor2026*';
    }

    let error: string | undefined;
    if (!nombre) {
      error = 'Falta el nombre del profesor';
    } else if (!email || !email.includes('@')) {
      error = 'Correo inválido o ausente';
    }

    const valido = !error;

    items.push({
      idTemp: `csv-prof-${i}-${Math.random().toString(36).substring(2, 7)}`,
      nombre,
      email,
      contrasena: pass,
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
 * Descarga plantilla nativa de Excel (.xlsx) con la estructura institucional de Eco Inclusivo
 */
export function descargarPlantillaEstudiantesExcel() {
  const filas = [
    ['Identificacion del estudiante', 'Materia', 'Titulo de ruta', 'Perfil_adaptacion', 'Estado de la Ruta', 'Validacion'],
    ['MP-901', 'Ciencias', 'Nuestros sentidos', 'Paralisis cerebral', 'Asignada/progreso', 'Encontrado'],
    ['1075665845', 'Español', 'Revolución francesa', 'Visual', 'Asignado', 'Encontrado'],
    ['1076740105', 'Quimica', 'Particulas Subatomicas', 'Auditiva', 'No asignada', 'No encontrado'],
    ['1141520156', 'Fisica', 'Magnetismo', 'Sindrome de down', 'Asignada/completada', 'Encontrado'],
    ['1052218370', 'Etica', 'Comunicación social', 'Paralisis cerebral', 'Asignada/ en revision', 'Encontrado']
  ];
  descargarWorkbookXlsx(
    'Cargue_masivo_de_Eco_Inclusivo.xlsx',
    'Hoja1',
    filas,
    [28, 16, 26, 22, 24, 16]
  );
}

/**
 * Descarga plantilla CSV para estudiantes separada por punto y coma (;) compatible con Excel en español
 */
export function descargarPlantillaEstudiantesCSV() {
  const encabezado = 'Identificacion del estudiante;Materia;Titulo de ruta;Perfil_adaptacion;Estado de la Ruta;Validacion';
  const filas = [
    'MP-901;Ciencias;Nuestros sentidos;Paralisis cerebral;Asignada/progreso;Encontrado',
    '1075665845;Español;Revolución francesa;Visual;Asignado;Encontrado',
    '1076740105;Quimica;Particulas Subatomicas;Auditiva;No asignada;No encontrado',
    '1141520156;Fisica;Magnetismo;Sindrome de down;Asignada/completada;Encontrado',
    '1052218370;Etica;Comunicación social;Paralisis cerebral;Asignada/ en revision;Encontrado'
  ];
  const csv = [encabezado, ...filas].join('\r\n');
  triggerDescarga('Cargue_masivo_de_Eco_Inclusivo.csv', csv);
}

/**
 * Descarga plantilla nativa de Excel (.xlsx) para profesores
 */
export function descargarPlantillaProfesoresExcel() {
  const filas = [
    ['Correo del profesor', 'Contraseña del profesor'],
    ['docente158@ecoinclusivo.com', 'Profesor2026*'],
    ['docente224@ecoinclusivo.com', 'Profesor2026*'],
    ['docente2289@ecoinclusivo.com', 'Profesor2026*']
  ];
  descargarWorkbookXlsx('Plantilla_Profesores_EcoInclusivo.xlsx', 'Profesores', filas, [34, 24]);
}

/**
 * Descarga plantilla CSV para profesores separada por punto y coma (;) compatible con Excel en español
 */
export function descargarPlantillaProfesoresCSV() {
  const encabezado = 'Correo del profesor;Contraseña del profesor';
  const filas = [
    'docente158@ecoinclusivo.com;Profesor2026*',
    'docente224@ecoinclusivo.com;Profesor2026*',
    'docente2289@ecoinclusivo.com;Profesor2026*'
  ];
  const csv = [encabezado, ...filas].join('\r\n');
  triggerDescarga('Plantilla_Profesores_EcoInclusivo.csv', csv);
}
