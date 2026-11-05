import { Injectable } from '@angular/core';
import axios from 'axios';
import { Storage } from '@ionic/storage-angular';

export interface Libro {
  id?: string;
  titulo: string;
  autor: string;
  isbn: string;
  paginas_totales: number;
  paginas_leidas?: number;
  estado: string;
  calificacion?: number;
  portada_url: string;
}

/**
 * PHP/PDO suele devolver los números como texto ("300"). Los convertimos aquí una sola vez
 * para que los select, las barras de progreso y las comparaciones funcionen bien.
 */
export function normalizarLibro(l: any): Libro {
  return {
    ...l,
    isbn: l.isbn ?? '',
    portada_url: l.portada_url ?? '',
    paginas_totales: Number(l.paginas_totales) || 0,
    paginas_leidas: Number(l.paginas_leidas) || 0,
    calificacion: Number(l.calificacion) || 0,
  };
}

@Injectable({
  providedIn: 'root',
})
export class LibrosService {
  private apiUrl = 'libros_api.php';
  private STORAGE_KEY = 'libros_cache';
  private ready: Promise<Storage>;

  constructor(private storage: Storage) {
    this.ready = this.storage.create();
  }

  // El token lo agrega automáticamente el interceptor de axios (app.component.ts)
  async obtenerLibros(): Promise<{ data: Libro[]; fromCache: boolean }> {
    const storage = await this.ready;
    try {
      const res = await axios.get(this.apiUrl);
      const data: Libro[] = (res.data.data || []).map(normalizarLibro);
      await storage.set(this.STORAGE_KEY, data);
      return { data, fromCache: false };
    } catch (error: any) {
      if (error?.response) {
        throw error; // el servidor respondió con error: no es un problema de red
      }
      console.warn('Sin red. Cargando libros desde almacenamiento local...');
      const localData = await storage.get(this.STORAGE_KEY);
      return { data: (localData || []).map(normalizarLibro), fromCache: true };
    }
  }

  async crearLibro(libro: Libro): Promise<any> {
    const res = await axios.post(this.apiUrl, libro);
    return res.data;
  }

  async actualizarLibro(id: string, libro: Libro): Promise<any> {
    const res = await axios.patch(`${this.apiUrl}?id=${encodeURIComponent(id)}`, libro);
    return res.data;
  }

  async eliminarLibro(id: string): Promise<any> {
    const res = await axios.delete(`${this.apiUrl}?id=${encodeURIComponent(id)}`);
    return res.data;
  }
}
