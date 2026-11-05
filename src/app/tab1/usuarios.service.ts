import { Injectable } from '@angular/core';
import axios from 'axios';
import { Storage } from '@ionic/storage-angular';

export interface Usuario {
  id: string;
  email: string;
  password?: string;
  created_at?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UsuariosService {
  private apiUrl = 'usuarios_api.php';
  private STORAGE_KEY = 'usuarios_cache';
  private ready: Promise<Storage>;

  constructor(private storage: Storage) {
    this.ready = this.storage.create();
  }

  // El token lo agrega automáticamente el interceptor de axios (app.component.ts)
  async obtenerUsuarios(): Promise<{ data: Usuario[]; fromCache: boolean }> {
    const storage = await this.ready;
    try {
      const res = await axios.get(this.apiUrl);
      const data: Usuario[] = res.data.data || [];
      await storage.set(this.STORAGE_KEY, data);
      return { data, fromCache: false };
    } catch (error: any) {
      // Solo usamos la caché si NO hubo respuesta del servidor (sin red / timeout)
      if (error?.response) {
        throw error;
      }
      console.warn('Sin red. Cargando usuarios desde almacenamiento local...');
      const localData = await storage.get(this.STORAGE_KEY);
      return { data: localData || [], fromCache: true };
    }
  }

  async crearUsuario(usuario: Usuario): Promise<any> {
    const res = await axios.post(this.apiUrl, {
      email: usuario.email.trim(),
      password: usuario.password,
    });
    return res.data;
  }

  async actualizarUsuario(id: string, usuario: Usuario): Promise<any> {
    const body: { email: string; password?: string } = { email: usuario.email.trim() };
    // La contraseña solo se envía si el admin escribió una nueva
    if (usuario.password) {
      body.password = usuario.password;
    }
    const res = await axios.patch(`${this.apiUrl}?id=${encodeURIComponent(id)}`, body);
    return res.data;
  }

  async eliminarUsuario(id: string): Promise<any> {
    const res = await axios.delete(`${this.apiUrl}?id=${encodeURIComponent(id)}`);
    return res.data;
  }
}
