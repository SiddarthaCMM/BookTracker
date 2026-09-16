import { Injectable } from '@angular/core';
import axios from 'axios';

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

  constructor() {}

  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return { headers: { 'Authorization': `Bearer ${token}` } };
  }

  async obtenerLibros(): Promise<Libro[]> {
    const res = await axios.get(this.apiUrl, this.getAuthHeaders());
    return res.data.data || [];
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