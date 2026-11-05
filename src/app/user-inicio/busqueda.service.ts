import { Injectable } from '@angular/core';
import axios from 'axios';

export interface LibroExterno {
  id?: string;
  titulo: string;
  autor: string;
  portada_url: string;
  paginas_totales: number;
  isbn: string;
}

@Injectable({
  providedIn: 'root',
})
export class BusquedaService {
  private apiUrl = 'libros_api.php';

  // Buscar en la API pública de Open Library (sin token: el interceptor no lo agrega a URLs externas)
  async buscarEnExterno(query: string): Promise<LibroExterno[]> {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=15`;
    const res = await axios.get(url, { timeout: 15000 });
    const items = res.data.docs || [];

    return items.map((item: any) => ({
      titulo: item.title || 'Sin título',
      autor: item.author_name ? item.author_name.join(', ') : 'Autor desconocido',
      portada_url: item.cover_i ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg` : '',
      paginas_totales: item.number_of_pages_median || 0,
      isbn: (item.isbn && item.isbn[0]) || (item.isbn_valid && item.isbn_valid[0]) || '',
    }));
  }

  // Guarda el libro en la colección del usuario
  async guardarLibro(libro: LibroExterno, estado: string) {
    const data: Record<string, unknown> = {
      titulo: libro.titulo,
      autor: libro.autor,
      isbn: libro.isbn,
      portada_url: libro.portada_url,
      paginas_totales: libro.paginas_totales,
      estado,
    };
    // Si el libro ya existe en la base de datos interna, se manda su id
    // (el backend puede usarlo para no duplicarlo)
    if (libro.id) {
      data['libro_id'] = libro.id;
    }
    const res = await axios.post(this.apiUrl, data);
    return res.data;
  }

  // Buscar en la base de datos local (PHP)
  async buscarEnInterno(query: string): Promise<LibroExterno[]> {
    const res = await axios.get(`${this.apiUrl}?search=${encodeURIComponent(query)}`);
    return res.data.data || [];
  }
}
