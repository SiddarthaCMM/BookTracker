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
  providedIn: 'root'
})
export class UsuariosService {
  private apiUrl = 'http://127.0.0.1/api/usuarios_api.php';
  private storageReady = false;
  private STORAGE_KEY = 'usuarios_cache';

  constructor(private storage: Storage) {
    this.init();
  }

  // Inicializar Ionic Storage (es obligatorio llamarlo una vez)
  private async init() {
    await this.storage.create();
    this.storageReady = true;
  }

  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token'); // Mantenemos el token para la API
    return { headers: { 'Authorization': `Bearer ${token}` } };
  }

  async obtenerUsuarios(): Promise<Usuario[]> {
    if (!this.storageReady) await this.init();

    try {
      // 1. Intentamos obtener de la API
      const res = await axios.get(this.apiUrl, this.getAuthHeaders());
      const data = res.data.data || [];
      
      // 2. Si hay éxito, guardamos en Ionic Storage (Caché)
      await this.storage.set(this.STORAGE_KEY, data);
      
      return data;
    } catch (error) {
      console.warn('Error de red. Cargando usuarios desde almacenamiento local...');
      // 3. Si falla (sin internet), leemos de Ionic Storage
      const localData = await this.storage.get(this.STORAGE_KEY);
      return localData || [];
    }
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