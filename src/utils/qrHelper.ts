/**
 * Configuración y utilidades de URLs para códigos QR en PanApp
 */

/** Dominio real donde se está sirviendo la app (Vercel, dominio propio, etc.). */
function browserOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return '';
}

export const FALLBACK_DEV_URL =
  (import.meta as any).env?.VITE_APP_URL || browserOrigin();

export const FALLBACK_SHARED_URL =
  (import.meta as any).env?.VITE_SHARED_URL || FALLBACK_DEV_URL || browserOrigin();

let cachedServerUrls: { devUrl?: string; sharedUrl?: string } | null = null;

export async function fetchServerAppUrls(): Promise<{ devUrl: string; sharedUrl: string }> {
  if (cachedServerUrls?.devUrl && cachedServerUrls?.sharedUrl) {
    return {
      devUrl: cachedServerUrls.devUrl,
      sharedUrl: cachedServerUrls.sharedUrl,
    };
  }

  try {
    const res = await fetch('/api/app-config');
    if (res.ok) {
      const data = await res.json();
      cachedServerUrls = {
        devUrl: data.devUrl || FALLBACK_DEV_URL,
        sharedUrl: data.sharedUrl || FALLBACK_SHARED_URL,
      };
      return cachedServerUrls as { devUrl: string; sharedUrl: string };
    }
  } catch (err) {
    console.warn('No se pudo obtener /api/app-config, usando fallbacks:', err);
  }

  return {
    devUrl: FALLBACK_DEV_URL,
    sharedUrl: FALLBACK_SHARED_URL,
  };
}

/**
 * Obtiene la URL activa actual donde está corriendo la aplicación
 * (Igual que en tus juegos anteriores: la URL real activa del navegador)
 */
export function getActiveLiveUrl(): string {
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    // Si no es localhost o es un dominio de Cloud Run / personalizado
    if (origin && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
      return origin;
    }
  }
  return FALLBACK_DEV_URL || browserOrigin();
}

/**
 * Añade el esquema si el usuario escribió solo un dominio o una IP.
 * Sin esquema, la cámara del móvil trata el texto del QR como una búsqueda
 * en vez de abrirlo como enlace.
 */
function ensureUrlScheme(url: string): string {
  if (!url || /^[a-z][a-z0-9+.-]*:\/\//i.test(url)) return url;

  const host = url.split('/')[0].split(':')[0];
  const isLocal =
    host === 'localhost' ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host);

  return `${isLocal ? 'http' : 'https'}://${url}`;
}

/**
 * Construye la URL final a codificar en el código QR
 */
export function buildQrTargetUrl(
  baseUrl?: string,
  params?: { recipeId?: string; groupId?: string }
): string {
  let target = (baseUrl || '').trim();
  if (!target) {
    target = getActiveLiveUrl();
  }

  target = ensureUrlScheme(target);

  // Quitar trailing slash si lo hay antes de query params
  if (target.endsWith('/')) {
    target = target.slice(0, -1);
  }

  const searchParams = new URLSearchParams();
  if (params?.recipeId) {
    searchParams.set('recipeId', params.recipeId);
  }
  if (params?.groupId) {
    searchParams.set('groupId', params.groupId);
  }

  const queryString = searchParams.toString();
  return queryString ? `${target}/?${queryString}` : `${target}/`;
}

/**
 * Devuelve la URL activa actual para el QR (modo normal directo)
 */
export function getCurrentAppUrl(params?: { recipeId?: string; groupId?: string }): string {
  return buildQrTargetUrl(getActiveLiveUrl(), params);
}

export function getAlternativeShareUrl(params?: { recipeId?: string; groupId?: string }): string {
  return buildQrTargetUrl(FALLBACK_SHARED_URL, params);
}

/**
 * Descarga una imagen codificada en dataURL convirtiéndola en un Blob real
 */
export function downloadDataUrlAsFile(dataUrl: string, filename: string): boolean {
  try {
    if (!dataUrl) return false;

    const parts = dataUrl.split(',');
    if (parts.length < 2) return false;

    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], { type: mime });

    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = blobUrl;
    link.download = filename;

    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      try {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
        URL.revokeObjectURL(blobUrl);
      } catch (e) {
        console.warn('Cleanup error', e);
      }
    }, 1500);

    return true;
  } catch (err) {
    console.error('Error downloading QR via Blob:', err);

    try {
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(`
          <!DOCTYPE html>
          <html>
            <head><title>${filename}</title></head>
            <body style="margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:#fff;font-family:sans-serif;">
              <img src="${dataUrl}" alt="QR" style="max-width:90vw;max-height:80vh;border:1px solid #ccc;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);" />
              <p style="margin-top:16px;color:#333;font-size:14px;font-weight:bold;">Mantén pulsada la imagen o haz clic derecho para guardar.</p>
            </body>
          </html>
        `);
        return true;
      }
    } catch (e2) {
      console.error('Window open fallback failed:', e2);
    }
    return false;
  }
}

/**
 * Copia la imagen del código QR al portapapeles directamente
 */
export async function copyQrImageToClipboard(dataUrl: string): Promise<boolean> {
  try {
    if (!navigator.clipboard || !window.ClipboardItem) return false;

    const parts = dataUrl.split(',');
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], { type: 'image/png' });

    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ]);
    return true;
  } catch (err) {
    console.warn('Could not copy image to clipboard', err);
    return false;
  }
}
