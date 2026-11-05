import { Injectable } from '@angular/core';
import axios from 'axios';

@Injectable({
  providedIn: 'root',
})
export class Tab3Service {
  private apiUrl = 'dashboard_api.php';

  // El token lo agrega automáticamente el interceptor de axios (app.component.ts)
  async getDashboardData(): Promise<any> {
    const res = await axios.get(this.apiUrl);
    return res.data;
  }
}
