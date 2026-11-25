export type InfoVideo =
  | { tipo: 'embed'; embedUrl: string; proveedor: 'youtube' | 'vimeo' | 'drive' }
  | { tipo: 'archivo'; src: string };

/**
 * Extrae información de reproducción para enlaces de YouTube, Vimeo, Google Drive o archivos de video directos (.mp4, .webm, etc.)
 */
export function obtenerInfoVideo(rawUrl?: string): InfoVideo | null {
  if (!rawUrl || !rawUrl.trim()) return null;
  const url = rawUrl.trim();

  // 1. YouTube (watch?v=, youtu.be/, shorts/, embed/)
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch && ytMatch[1]) {
    return {
      tipo: 'embed',
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`,
      proveedor: 'youtube'
    };
  }

  // 2. Vimeo
  const vimeoMatch = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      tipo: 'embed',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      proveedor: 'vimeo'
    };
  }

  // 3. Google Drive video
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return {
      tipo: 'embed',
      embedUrl: `https://drive.google.com/file/d/${driveMatch[1]}/preview`,
      proveedor: 'drive'
    };
  }

  // 4. Archivo directo (.mp4, .webm, .ogg, .mov, data:video, blob:, etc.)
  return {
    tipo: 'archivo',
    src: url
  };
}

export function esUrlDeVideo(url?: string): boolean {
  if (!url) return false;
  const clean = url.trim();
  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(clean) || clean.startsWith('data:video/') || clean.includes('/videos/')) {
    return true;
  }
  const info = obtenerInfoVideo(clean);
  return info?.tipo === 'embed';
}
