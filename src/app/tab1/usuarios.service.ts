import { Injectable } from '@angular/core';
import axios from 'axios';
import { Storage } from '@ionic/storage-angular';
import { Preferences } from '@capacitor/preferences';
import { environment } from '../../environments/environment';

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
  private apiUrl = `${environment.apiUrl}usuarios_api.php`;
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

  private async getAuthHeaders() {
    const { value } = await Preferences.get({ key: 'auth_token' });
    return { headers: { 'X-Auth-Token': value || '' } }; // <--- Cambiamos el nombre del header
  }

  async obtenerUsuarios(): Promise<{ data: Usuario[], fromCache: boolean }> {
    if (!this.storageReady) await this.init();

    try {
      const res = await axios.get(this.apiUrl, await this.getAuthHeaders());
      const data = res.data.data || [];
      await this.storage.set(this.STORAGE_KEY, data);
      return { data, fromCache: false }; // Datos frescos del servidor
    } catch (error) {
      console.warn('Error de red. Cargando usuarios desde almacenamiento local...');
      const localData = await this.storage.get(this.STORAGE_KEY);
      return { data: localData || [], fromCache: true }; // Datos de caché
    }
  }

  async crearUsuario(usuario: Usuario): Promise<any> {
    const res = await axios.post(this.apiUrl, {
      email: usuario.email,
      password: usuario.password
    }, await this.getAuthHeaders()); // <--- AÑADIDO await
    return res.data;
  }

  async actualizarUsuario(id: string, usuario: Usuario): Promise<any> {
    const res = await axios.patch(`${this.apiUrl}?id=${id}`, {
      email: usuario.email,
      password: usuario.password
    }, await this.getAuthHeaders()); // <--- AÑADIDO await
    return res.data;
  }

  async eliminarUsuario(id: string): Promise<any> {
    const res = await axios.delete(`${this.apiUrl}?id=${id}`, await this.getAuthHeaders()); // <--- AÑADIDO await
    return res.data;
  }
}