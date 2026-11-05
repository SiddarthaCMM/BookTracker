import { environment } from '../environments/environment';

/**
 * Convierte lo que escribe el usuario ("192.168.1.65", "192.168.1.65:8080",
 * "http://miservidor.com/api") en la URL base de la API, siempre con "/api/" al final.
 */
export function buildApiUrl(host?: string | null): string {
  const raw = (host ?? '').trim();
  if (!raw) {
    return environment.apiUrl;
  }
  const conProtocolo = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
  const base = conProtocolo.replace(/\/+$/, '').replace(/\/api$/i, '');
  return `${base}/api/`;
}
