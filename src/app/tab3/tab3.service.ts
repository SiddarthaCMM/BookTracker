import { Injectable } from '@angular/core';
import axios from 'axios';
import { Preferences } from '@capacitor/preferences';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Tab3Service {
  private apiUrl = `${environment.apiUrl}dashboard_api.php`;

  private async getAuthHeaders() {
    const { value } = await Preferences.get({ key: 'auth_token' });
    return { headers: { 'X-Auth-Token': value || '' } };
  }

  async getDashboardData(): Promise<any> {
    const res = await axios.get(this.apiUrl, await this.getAuthHeaders());
    return res.data;
  }
}