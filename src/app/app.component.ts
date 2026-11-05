import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import axios from 'axios';
import { Preferences } from '@capacitor/preferences';
import { LoginService } from './login/login.service';
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
  private loginService = inject(LoginService);

  constructor() {
    // Valores síncronos: así ninguna petición sale sin baseURL ni token
    axios.defaults.baseURL = buildApiUrl(null);
    axios.defaults.timeout = 15000;
    this.configurarInterceptores();
  }

  async ngOnInit() {
    // Si el usuario guardó una IP en la pantalla de configuración, la usamos
    const { value: ipGuardada } = await Preferences.get({ key: 'api_ip' });
    axios.defaults.baseURL = buildApiUrl(ipGuardada);
  }

  private configurarInterceptores() {
    // 1. Adjunta el token a TODAS las peticiones a nuestra API (nunca a sitios externos)
    axios.interceptors.request.use(async (config) => {
      const esExterna = /^https?:\/\//i.test(config.url ?? '');
      if (!esExterna) {
        const { value } = await Preferences.get({ key: 'auth_token' });
        if (value) {
          config.headers.set('X-Auth-Token', value);
        }
      }
      return config;
    });

    // 2. Si el servidor responde 401 (token vencido/inválido), cerramos sesión
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const url: string = error?.config?.url ?? '';
        const esExterna = /^https?:\/\//i.test(url);
        const esLogin = url.includes('login.php');
        if (error?.response?.status === 401 && !esExterna && !esLogin) {
          await this.loginService.cerrarSesion();
          this.router.navigateByUrl('/login');
        }
        return Promise.reject(error);
      }
    );
  }
}
