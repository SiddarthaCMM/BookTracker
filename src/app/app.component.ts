import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import axios from 'axios';
import { Preferences } from '@capacitor/preferences';
import { AuthService } from './services/auth.service';
import { buildApiUrl } from './api-config';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);

  constructor() {
    axios.defaults.baseURL = buildApiUrl(null);
    axios.defaults.timeout = 15000;
    this.configurarInterceptores();
  }

  async ngOnInit() {
    const { value: ipGuardada } = await Preferences.get({ key: 'api_ip' });
    axios.defaults.baseURL = buildApiUrl(ipGuardada);
  }

  private configurarInterceptores() {
    // 1. Adjunta el token (leído del almacenamiento seguro) a TODAS las
    //    peticiones a nuestra API (nunca a sitios externos).
    axios.interceptors.request.use(async (config) => {
      const esExterna = /^https?:\/\//i.test(config.url ?? '');
      if (!esExterna) {
        const token = await this.authService.obtenerToken();
        if (token) {
          config.headers.set('X-Auth-Token', token);
        }
      }
      return config;
    });

    // 2. RF-AUT-06: si el servidor responde 401 (token inválido/expirado),
    //    limpiamos sesión y redirigimos al login. (Esto ya existía pero
    //    ahora también limpia el SecureStorage vía AuthService.)
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const url: string = error?.config?.url ?? '';
        const esExterna = /^https?:\/\//i.test(url);
        const esLogin = url.includes('login.php');
        const esLogout = url.includes('logout.php');
        if (error?.response?.status === 401 && !esExterna && !esLogin && !esLogout) {
          await this.authService.cerrarSesion();
          this.router.navigateByUrl('/login');
        }
        return Promise.reject(error);
      }
    );
  }
}