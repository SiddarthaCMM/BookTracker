import { Injectable } from '@angular/core';
import axios from 'axios';

export interface Perfil {
  username: string;
  nombre: string;
  email: string;
  birth_date: string;
  idioma: string;
  foto_url: string;
  /** RF-AUT-04: fecha de verificación de correo (null = sin verificar). */
  email_verified_at: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class PerfilService {
  private apiUrl = 'perfil_api.php';

  async getPerfil(): Promise<Partial<Perfil> | null> {
    const res = await axios.get(this.apiUrl);
    return res.data.data ?? null;
  }

  async actualizarPerfil(data: Perfil): Promise<any> {
    const res = await axios.patch(this.apiUrl, data);
    return res.data;
  }
}