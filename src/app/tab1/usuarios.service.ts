import { Injectable } from '@angular/core';
import axios from 'axios';

export interface Usuario {
  id: string;
  email: string;
  password?: string;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private apiUrl = 'http://127.0.0.1/api/usuarios_api.php';

  constructor() {}

  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return { headers: { 'Authorization': `Bearer ${token}` } };
  }

  async obtenerUsuarios(): Promise<Usuario[]> {
    const res = await axios.get(this.apiUrl, this.getAuthHeaders());
    return res.data.data || [];
  }

  async crearUsuario(usuario: Usuario): Promise<any> {
    const res = await axios.post(this.apiUrl, {
      email: usuario.email,
      password: usuario.password
    }, this.getAuthHeaders());
    return res.data;
  }

  async actualizarUsuario(id: string, usuario: Usuario): Promise<any> {
    const res = await axios.patch(`${this.apiUrl}?id=${id}`, {
      email: usuario.email,
      password: usuario.password
    }, this.getAuthHeaders());
    return res.data;
  }

  async eliminarUsuario(id: string): Promise<any> {
    const res = await axios.delete(`${this.apiUrl}?id=${id}`, this.getAuthHeaders());
    return res.data;
  }
}