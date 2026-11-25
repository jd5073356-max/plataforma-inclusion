/**
 * Utilidad ligera sin dependencias externas para generar y leer archivos Excel (.xlsx) reales
 * compatibles con Microsoft Excel (Windows/Mac), Google Sheets y LibreOffice.
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function escaparXml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function desescaparXml(texto: string): string {
  return texto
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function indiceAColumna(idx: number): string {
  let col = '';
  let n = idx + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    col = String.fromCharCode(65 + rem) + col;
    n = Math.floor((n - 1) / 26);
  }
  return col;
}

function columnaAIndice(refCelda: string): number {
  const match = refCelda.match(/^([A-Z]+)/i);
  if (!match) return -1;
  const letras = match[1].toUpperCase();
  let idx = 0;
  for (let i = 0; i < letras.length; i++) {
    idx = idx * 26 + (letras.charCodeAt(i) - 64);
  }
  return idx - 1;
}

function crearZipSinCompresion(archivos: { ruta: string; contenido: string }[]): Uint8Array {
  const encoder = new TextEncoder();
  const entradas = archivos.map((a) => {
    const nombreBytes = encoder.encode(a.ruta);
    const datosBytes = encoder.encode(a.contenido);
    const crc = crc32(datosBytes);
    return { nombreBytes, datosBytes, crc };
  });

  let tamLocal = 0;
  let tamCentral = 0;
  for (const e of entradas) {
    tamLocal += 30 + e.nombreBytes.length + e.datosBytes.length;
    tamCentral += 46 + e.nombreBytes.length;
  }

  const total = tamLocal + tamCentral + 22;
  const salida = new Uint8Array(total);
  const view = new DataView(salida.buffer);

  let offsetLocal = 0;
  const offsetsLocales: number[] = [];

  for (const e of entradas) {
    offsetsLocales.push(offsetLocal);
    view.setUint32(offsetLocal, 0x04034b50, true); // Local file header signature
    view.setUint16(offsetLocal + 4, 20, true);     // Version needed (2.0)
    view.setUint16(offsetLocal + 6, 0x0800, true); // UTF-8 filename flag
    view.setUint16(offsetLocal + 8, 0, true);      // Method 0: STORE
    view.setUint16(offsetLocal + 10, 0, true);     // Mod time
    view.setUint16(offsetLocal + 12, 0x21, true);  // Mod date
    view.setUint32(offsetLocal + 14, e.crc, true);
    view.setUint32(offsetLocal + 18, e.datosBytes.length, true);
    view.setUint32(offsetLocal + 22, e.datosBytes.length, true);
    view.setUint16(offsetLocal + 26, e.nombreBytes.length, true);
    view.setUint16(offsetLocal + 28, 0, true);
    salida.set(e.nombreBytes, offsetLocal + 30);
    salida.set(e.datosBytes, offsetLocal + 30 + e.nombreBytes.length);
    offsetLocal += 30 + e.nombreBytes.length + e.datosBytes.length;
  }

  const inicioCentral = offsetLocal;
  let offsetCentral = inicioCentral;

  for (let i = 0; i < entradas.length; i++) {
    const e = entradas[i];
    view.setUint32(offsetCentral, 0x02014b50, true); // Central directory signature
    view.setUint16(offsetCentral + 4, 20, true);     // Version made by
    view.setUint16(offsetCentral + 6, 20, true);     // Version needed
    view.setUint16(offsetCentral + 8, 0x0800, true); // UTF-8 flag
    view.setUint16(offsetCentral + 10, 0, true);    // Method 0: STORE
    view.setUint16(offsetCentral + 12, 0, true);
    view.setUint16(offsetCentral + 14, 0x21, true);
    view.setUint32(offsetCentral + 16, e.crc, true);
    view.setUint32(offsetCentral + 20, e.datosBytes.length, true);
    view.setUint32(offsetCentral + 24, e.datosBytes.length, true);
    view.setUint16(offsetCentral + 28, e.nombreBytes.length, true);
    view.setUint16(offsetCentral + 30, 0, true);
    view.setUint16(offsetCentral + 32, 0, true);
    view.setUint16(offsetCentral + 34, 0, true);
    view.setUint16(offsetCentral + 36, 0, true);
    view.setUint32(offsetCentral + 38, 0, true);
    view.setUint32(offsetCentral + 42, offsetsLocales[i], true);
    salida.set(e.nombreBytes, offsetCentral + 46);
    offsetCentral += 46 + e.nombreBytes.length;
  }

  // End of Central Directory (EOCD)
  view.setUint32(offsetCentral, 0x06054b50, true);
  view.setUint16(offsetCentral + 4, 0, true);
  view.setUint16(offsetCentral + 6, 0, true);
  view.setUint16(offsetCentral + 8, entradas.length, true);
  view.setUint16(offsetCentral + 10, entradas.length, true);
  view.setUint32(offsetCentral + 12, tamCentral, true);
  view.setUint32(offsetCentral + 16, inicioCentral, true);
  view.setUint16(offsetCentral + 20, 0, true);

  return salida;
}

/**
 * Genera los bytes de un libro Excel (.xlsx) con encabezados destacados y columnas anchas
 */
export function generarWorkbookXlsx(
  nombreHoja: string,
  filas: string[][],
  anchosColumnas: number[] = [34, 16, 28, 30]
): Uint8Array {
  const colsXml = anchosColumnas
    .map((w, idx) => `<col min="${idx + 1}" max="${idx + 1}" width="${w}" customWidth="1"/>`)
    .join('');

  const rowsXml = filas
    .map((fila, rIdx) => {
      const numFila = rIdx + 1;
      const estilo = rIdx === 0 ? ' s="1"' : ' s="0"';
      const celdas = fila
        .map((valor, cIdx) => {
          const ref = `${indiceAColumna(cIdx)}${numFila}`;
          const limpio = escaparXml(valor ?? '');
          return `<c r="${ref}" t="inlineStr"${estilo}><is><t xml:space="preserve">${limpio}</t></is></c>`;
        })
        .join('');
      const altura = rIdx === 0 ? ' ht="24" customHeight="1"' : ' ht="19" customHeight="1"';
      return `<row r="${numFila}"${altura}>${celdas}</row>`;
    })
    .join('');

  const sheetXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<cols>${colsXml}</cols>` +
    `<sheetData>${rowsXml}</sheetData>` +
    `</worksheet>`;

  const stylesXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<fonts count="2">` +
    `<font><sz val="11"/><name val="Calibri"/><color rgb="FF1C1917"/></font>` +
    `<font><b/><sz val="11"/><name val="Calibri"/><color rgb="FFFFFFFF"/></font>` +
    `</fonts>` +
    `<fills count="3">` +
    `<fill><patternFill patternType="none"/></fill>` +
    `<fill><patternFill patternType="gray125"/></fill>` +
    `<fill><patternFill patternType="solid"><fgColor rgb="FFEE7C6A"/><bgColor indexed="64"/></patternFill></fill>` +
    `</fills>` +
    `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>` +
    `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
    `<cellXfs count="2">` +
    `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
    `<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>` +
    `</cellXfs>` +
    `</styleSheet>`;

  const workbookXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `<sheets><sheet name="${escaparXml(nombreHoja.slice(0, 31))}" sheetId="1" r:id="rId1"/></sheets>` +
    `</workbook>`;

  const workbookRelsXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
    `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
    `</Relationships>`;

  const rootRelsXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
    `</Relationships>`;

  const contentTypesXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
    `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
    `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
    `</Types>`;

  return crearZipSinCompresion([
    { ruta: '[Content_Types].xml', contenido: contentTypesXml },
    { ruta: '_rels/.rels', contenido: rootRelsXml },
    { ruta: 'xl/workbook.xml', contenido: workbookXml },
    { ruta: 'xl/_rels/workbook.xml.rels', contenido: workbookRelsXml },
    { ruta: 'xl/styles.xml', contenido: stylesXml },
    { ruta: 'xl/worksheets/sheet1.xml', contenido: sheetXml }
  ]);
}

export function descargarWorkbookXlsx(
  nombreArchivo: string,
  nombreHoja: string,
  filas: string[][],
  anchosColumnas?: number[]
) {
  const bytes = generarWorkbookXlsx(nombreHoja, filas, anchosColumnas);
  const blob = new Blob([bytes.buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo.endsWith('.xlsx') ? nombreArchivo : `${nombreArchivo}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function descomprimirDeflateRaw(comprimido: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('Tu navegador no soporta lectura directa de .xlsx comprimido. Guárdalo como CSV.');
  }
  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  writer.write(comprimido as unknown as BufferSource);
  writer.close();

  const reader = ds.readable.getReader();
  const partes: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      partes.push(value);
      total += value.length;
    }
  }
  const resultado = new Uint8Array(total);
  let pos = 0;
  for (const p of partes) {
    resultado.set(p, pos);
    pos += p.length;
  }
  return resultado;
}

async function extraerArchivosZip(buffer: ArrayBuffer): Promise<Map<string, string>> {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const decoder = new TextDecoder('utf-8');

  // Buscar firma EOCD (0x06054b50) desde el final
  let eocdOffset = -1;
  const minPos = Math.max(0, bytes.length - 65557);
  for (let i = bytes.length - 22; i >= minPos; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) {
    throw new Error('El archivo no tiene un formato Excel (.xlsx) válido.');
  }

  const totalEntradas = view.getUint16(eocdOffset + 10, true);
  let ptrCentral = view.getUint32(eocdOffset + 16, true);
  const resultado = new Map<string, string>();

  for (let i = 0; i < totalEntradas; i++) {
    if (view.getUint32(ptrCentral, true) !== 0x02014b50) break;
    const metodo = view.getUint16(ptrCentral + 10, true);
    const tamComprimido = view.getUint32(ptrCentral + 20, true);
    const lenNombre = view.getUint16(ptrCentral + 28, true);
    const lenExtra = view.getUint16(ptrCentral + 30, true);
    const lenComentario = view.getUint16(ptrCentral + 32, true);
    const offsetLocal = view.getUint32(ptrCentral + 42, true);

    const nombre = decoder.decode(bytes.subarray(ptrCentral + 46, ptrCentral + 46 + lenNombre));
    ptrCentral += 46 + lenNombre + lenExtra + lenComentario;

    // Solo necesitamos sharedStrings y la primera hoja de cálculo
    if (!nombre.endsWith('.xml')) continue;
    if (nombre !== 'xl/sharedStrings.xml' && !nombre.startsWith('xl/worksheets/sheet')) continue;

    const lenNombreLocal = view.getUint16(offsetLocal + 26, true);
    const lenExtraLocal = view.getUint16(offsetLocal + 28, true);
    const inicioDatos = offsetLocal + 30 + lenNombreLocal + lenExtraLocal;
    const datosCrudos = bytes.subarray(inicioDatos, inicioDatos + tamComprimido);

    let descomprimido: Uint8Array;
    if (metodo === 0) {
      descomprimido = datosCrudos;
    } else if (metodo === 8) {
      descomprimido = await descomprimirDeflateRaw(datosCrudos);
    } else {
      continue;
    }

    resultado.set(nombre, decoder.decode(descomprimido));
  }

  return resultado;
}

function extraerTextoDeNodosT(fragmentoXml: string): string {
  const partes: string[] = [];
  const regexT = /<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g;
  let m: RegExpExecArray | null;
  while ((m = regexT.exec(fragmentoXml)) !== null) {
    partes.push(desescaparXml(m[1]));
  }
  return partes.join('');
}

/**
 * Lee la primera hoja de un archivo Excel (.xlsx) y devuelve una matriz de filas y columnas
 */
export async function leerWorkbookXlsx(buffer: ArrayBuffer): Promise<string[][]> {
  const archivos = await extraerArchivosZip(buffer);

  // 1. Leer sharedStrings si existen
  const sharedStrings: string[] = [];
  const ssXml = archivos.get('xl/sharedStrings.xml');
  if (ssXml) {
    const regexSi = /<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g;
    let m: RegExpExecArray | null;
    while ((m = regexSi.exec(ssXml)) !== null) {
      sharedStrings.push(extraerTextoDeNodosT(m[1]));
    }
  }

  // 2. Localizar primera hoja (sheet1.xml o la primera disponible)
  let sheetXml = archivos.get('xl/worksheets/sheet1.xml');
  if (!sheetXml) {
    for (const [ruta, contenido] of archivos.entries()) {
      if (ruta.startsWith('xl/worksheets/sheet')) {
        sheetXml = contenido;
        break;
      }
    }
  }
  if (!sheetXml) return [];

  // 3. Extraer filas y celdas respetando posición de columna (A, B, C...)
  const filas: string[][] = [];
  const regexRow = /<row(?:\s[^>]*)?>([\s\S]*?)<\/row>/g;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = regexRow.exec(sheetXml)) !== null) {
    const rowContent = rowMatch[1];
    const filaActual: string[] = [];
    let colCursor = 0;

    // Coincidir tanto celdas con cierre </c> como autocerradas <c ... />
    const regexCell = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
    let cellMatch: RegExpExecArray | null;

    while ((cellMatch = regexCell.exec(rowContent)) !== null) {
      const attrs = cellMatch[1] || '';
      const inner = cellMatch[2] || '';

      const refMatch = attrs.match(/\br="([A-Z]+\d+)"/i);
      const tipoMatch = attrs.match(/\bt="([^"]+)"/);

      const colIdx = refMatch ? columnaAIndice(refMatch[1]) : colCursor;
      const targetCol = colIdx >= 0 ? colIdx : colCursor;
      while (filaActual.length < targetCol) {
        filaActual.push('');
      }

      let valor = '';
      const tipo = tipoMatch ? tipoMatch[1] : '';
      if (tipo === 'inlineStr') {
        valor = extraerTextoDeNodosT(inner);
      } else {
        const vMatch = inner.match(/<v(?:\s[^>]*)?>([\s\S]*?)<\/v>/);
        const rawV = vMatch ? desescaparXml(vMatch[1].trim()) : '';
        if (tipo === 's') {
          const idxStr = parseInt(rawV, 10);
          valor = !Number.isNaN(idxStr) && sharedStrings[idxStr] !== undefined ? sharedStrings[idxStr] : rawV;
        } else {
          valor = rawV;
        }
      }

      filaActual[targetCol] = valor.trim();
      colCursor = targetCol + 1;
    }

    if (filaActual.some((c) => c !== '')) {
      filas.push(filaActual);
    }
  }

  return filas;
}

/**
 * Decodifica un archivo de texto CSV soportando tanto UTF-8 como Windows-1252 (Excel clásico en español)
 */
export function decodificarTextoCSV(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder('windows-1252').decode(bytes);
  }
}

export function esBufferZipXlsx(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 4) return false;
  const b = new Uint8Array(buffer, 0, 4);
  return b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04;
}
