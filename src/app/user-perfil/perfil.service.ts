import { Injectable } from '@angular/core';
import axios from 'axios';
import { Preferences } from '@capacitor/preferences';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PerfilService {
  private apiUrl = 'perfil_api.php';

  private async getAuthHeaders() {
    const { value } = await Preferences.get({ key: 'auth_token' });
    return { headers: { 'X-Auth-Token': value || '' } };
  }

  async getPerfil(): Promise<any> {
    const res = await axios.get(this.apiUrl, await this.getAuthHeaders());
    return res.data.data;
  }

  async actualizarPerfil(data: any): Promise<any> {
    const res = await axios.patch(this.apiUrl, data, await this.getAuthHeaders());
    return res.data;
  }
}