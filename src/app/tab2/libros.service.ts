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

@Injectable({
  providedIn: 'root'
})
export class LibrosService {
  private apiUrl = 'http://127.0.0.1/api/libros_api.php';
  private storageReady = false;
  private STORAGE_KEY = 'libros_cache';

  constructor(private storage: Storage) {
    this.init();
  }

  private async init() {
    await this.storage.create();
    this.storageReady = true;
  }

  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return { headers: { 'Authorization': `Bearer ${token}` } };
  }

  async obtenerLibros(): Promise<Libro[]> {
    if (!this.storageReady) await this.init();

    try {
      // 1. Intentamos obtener de la API
      const res = await axios.get(this.apiUrl, this.getAuthHeaders());
      const data = res.data.data || [];
      
      // 2. Si hay éxito, guardamos en Ionic Storage (Caché)
      await this.storage.set(this.STORAGE_KEY, data);
      
      return data;
    } catch (error) {
      console.warn('Error de red. Cargando libros desde almacenamiento local...');
      // 3. Si falla, leemos de Ionic Storage
      const localData = await this.storage.get(this.STORAGE_KEY);
      return localData || [];
    }
  }

  async crearLibro(libro: Libro): Promise<any> {
    const res = await axios.post(this.apiUrl, libro, this.getAuthHeaders());
    return res.data;
  }

  async actualizarLibro(id: string, libro: Libro): Promise<any> {
    const res = await axios.patch(`${this.apiUrl}?id=${id}`, libro, this.getAuthHeaders());
    return res.data;
  }

  async eliminarLibro(id: string): Promise<any> {
    const res = await axios.delete(`${this.apiUrl}?id=${id}`, this.getAuthHeaders());
    return res.data;
  }
}