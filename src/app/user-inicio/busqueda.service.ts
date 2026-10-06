import { Injectable } from '@angular/core';
import axios from 'axios';
import { Preferences } from '@capacitor/preferences';
import { environment } from '../../environments/environment';

export interface LibroGoogle {
  titulo: string;
  autor: string;
  portada_url: string;
  paginas_totales: number;
  isbn: string;
}

@Injectable({
  providedIn: 'root'
})
export class BusquedaService {
  private googleApi = 'https://www.googleapis.com/books/v1/volumes?q=';
  private apiUrl = `${environment.apiUrl}libros_api.php`;

  private async getAuthHeaders() {
    const { value } = await Preferences.get({ key: 'auth_token' });
    return { headers: { 'X-Auth-Token': value || '' } };
  }

  // Buscar en la API de OpenLibrary
  async buscarEnGoogle(query: string): Promise<LibroGoogle[]> {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=15`;
    const res = await axios.get(url);
    const items = res.data.docs || [];
    
    return items.map((item: any) => ({
      titulo: item.title || 'Sin título',
      autor: item.author_name ? item.author_name.join(', ') : 'Autor desconocido',
      // OpenLibrary usa cover_i, cover_edition_key o edition_key
      portada_url: item.cover_i ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg` : '',
      paginas_totales: item.number_of_pages_median || 0,
      // A veces el ISBN viene en isbn o en isbn_valid
      isbn: (item.isbn && item.isbn[0]) || (item.isbn_valid && item.isbn_valid[0]) || ''
    }));
  }

  // Simplificado: solo mandamos el libro y el estado
  async guardarLibro(libro: LibroGoogle, estado: string) {
    const data = {
      titulo: libro.titulo,
      autor: libro.autor,
      isbn: libro.isbn,
      portada_url: libro.portada_url,
      paginas_totales: libro.paginas_totales,
      estado: estado
    };
    const res = await axios.post(this.apiUrl, data, await this.getAuthHeaders());
    return res.data;
  }

    // Buscar en la base de datos local (PHP)
  async buscarEnInterno(query: string): Promise<any[]> {
    const res = await axios.get(`${this.apiUrl}?search=${encodeURIComponent(query)}`, await this.getAuthHeaders());
    return res.data.data || [];
  }
}