import { Injectable } from '@angular/core';
import axios from 'axios';
import { Storage } from '@ionic/storage-angular';
import { Preferences } from '@capacitor/preferences'; // <--- IMPORTADO
import { environment } from '../../environments/environment';

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

@Injectable({
  providedIn: 'root'
})
export class LibrosService {
  private apiUrl = `${environment.apiUrl}libros_api.php`;
  private storageReady = false;
  private STORAGE_KEY = 'libros_cache';

  constructor(private storage: Storage) {
    this.init();
  }

  private async init() {
    await this.storage.create();
    this.storageReady = true;
  }

  private async getAuthHeaders() {
    const { value } = await Preferences.get({ key: 'auth_token' });
    return { headers: { 'X-Auth-Token': value || '' } }; // <--- Cambiamos el nombre del header
  }

  async obtenerLibros(): Promise<{ data: Libro[], fromCache: boolean }> {
    if (!this.storageReady) await this.init();

    try {
      const res = await axios.get(this.apiUrl, await this.getAuthHeaders());
      const data = res.data.data || [];
      await this.storage.set(this.STORAGE_KEY, data);
      return { data, fromCache: false };
    } catch (error) {
      console.warn('Error de red. Cargando libros desde almacenamiento local...');
      const localData = await this.storage.get(this.STORAGE_KEY);
      return { data: localData || [], fromCache: true };
    }
  }

  async crearLibro(libro: Libro): Promise<any> {
    const res = await axios.post(this.apiUrl, libro, await this.getAuthHeaders()); // <--- AÑADIDO await
    return res.data;
  }

  async actualizarLibro(id: string, libro: Libro): Promise<any> {
    const res = await axios.patch(`${this.apiUrl}?id=${id}`, libro, await this.getAuthHeaders()); // <--- AÑADIDO await
    return res.data;
  }

  async eliminarLibro(id: string): Promise<any> {
    const res = await axios.delete(`${this.apiUrl}?id=${id}`, await this.getAuthHeaders()); // <--- AÑADIDO await
    return res.data;
  }
}