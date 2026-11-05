import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, ToastController,
  IonButtons, IonButton, IonIcon, IonModal, IonInput, IonItem, IonCheckbox,
} from '@ionic/angular';
import { LoginService } from './login.service';
import { UserCredentials } from './login.models';
import { Preferences } from '@capacitor/preferences';
import axios from 'axios';
import { addIcons } from 'ionicons';
import { settingsOutline } from 'ionicons/icons';
import { buildApiUrl } from '../api-config';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButtons, IonButton, IonIcon, IonModal, IonInput, IonItem, IonCheckbox,
  ],
})
export class LoginPage {
  user: UserCredentials = {
    email: '',
    password: '',
    remember_me: true,
  };

  isConfigOpen = false;
  ipInput = '';
  mostrarPassword = false;
  enviando = false;

  // Cuenta regresiva de bloqueo (429)
  bloqueadoSeg = 0;
  private bloqueoTimer: any = null;

  constructor(
    private toastController: ToastController,
    private router: Router,
    private loginService: LoginService,
    private cdr: ChangeDetectorRef,
  ) {
    addIcons({ 'settings-outline': settingsOutline });
  }

  // ───────────────────────────────────────────────────────────────
  // RF-AUT-01: enlace "Crear cuenta"
  // ───────────────────────────────────────────────────────────────
  irARegistro(): void {
    this.router.navigateByUrl('/register');
  }

  // RF-AUT-03: enlace "¿Olvidaste tu contraseña?" → /forgot-password
  irARecuperar(): void {
    this.router.navigateByUrl('/forgot-password');
  }

  async abrirConfig() {
    const { value } = await Preferences.get({ key: 'api_ip' });
    this.ipInput = value || '';
    this.isConfigOpen = true;
    this.cdr.markForCheck();
  }

  cerrarConfig() {
    this.isConfigOpen = false;
    this.cdr.markForCheck();
  }

  async guardarIp() {
    const ip = this.ipInput.trim();
    if (ip) {
      await Preferences.set({ key: 'api_ip', value: ip });
    } else {
      await Preferences.remove({ key: 'api_ip' });
    }
    axios.defaults.baseURL = buildApiUrl(ip);
    this.cerrarConfig();
    await this.presentToast(ip ? 'IP actualizada correctamente' : 'Usando la IP por defecto');
  }

  // ───────────────────────────────────────────────────────────────
  // RF-AUT-02: submit
  // ───────────────────────────────────────────────────────────────
  async login(): Promise<void> {
    if (this.enviando) return;
    if (this.bloqueadoSeg > 0) return; // aún bloqueado

    const email = this.user.email.trim().toLowerCase();
    if (!email || !this.user.password) {
      await this.presentToast('Escribe tu correo y contraseña');
      return;
    }

    this.enviando = true;
    this.cdr.markForCheck();

    try {
      const response = await this.loginService.login({
        email,
        password: this.user.password,
        remember_me: this.user.remember_me ?? false,
      });

      if (response.success && response.user_id && response.token && response.role) {
        await this.loginService.guardarSesion(
          response.user_id,
          response.token,
          response.role,
          response.token_expires_in,
        );
        this.user.password = '';
        await this.presentToast('Login exitoso');
        await this.redirigirPorRol(response.role);
      } else {
        await this.presentToast(response.message || 'Credenciales inválidas');
      }
    } catch (error: any) {
      await this.manejarErrorLogin(error);
    } finally {
      this.enviando = false;
      this.cdr.markForCheck();
    }
  }

  // ───────────────────────────────────────────────────────────────
  // RF-AUT-02: manejo de errores diferenciado
  // ───────────────────────────────────────────────────────────────
  private async manejarErrorLogin(error: any): Promise<void> {
    const status = error?.response?.status;
    const data = error?.response?.data;

    if (status === 429) {
      // Bloqueo por rate-limit: arranca cuenta regresiva
      const retry = data?.retry_after ?? 900;
      this.iniciarCuentaRegresiva(retry);
      await this.presentToast(data?.message || 'Demasiados intentos. Intenta más tarde.');
      return;
    }

    if (status === 403) {
      // Cuenta desactivada
      await this.presentToast(data?.message || 'Tu cuenta está desactivada. Contacta al administrador.');
      return;
    }

    if (status === 401 || status === 404) {
      // Credenciales inválidas (mensaje genérico del servidor, no revela cuál falló)
      const msg = data?.message || 'Correo o contraseña incorrectos';
      const restantes = data?.attempts_remaining;
      const toast = restantes !== undefined && restantes <= 2
        ? `${msg}. Te quedan ${restantes} intento(s).`
        : msg;
      await this.presentToast(toast);
      return;
    }

    if (error?.code === 'ECONNABORTED') {
      await this.presentToast('El servidor tardó demasiado');
      return;
    }

    if (!error?.response) {
      // Sin respuesta del servidor
      await this.presentToast('No se pudo conectar con el servidor');
      return;
    }

    await this.presentToast(data?.message || 'Error de conexión con el servidor');
  }

  // ───────────────────────────────────────────────────────────────
  // Cuenta regresiva del bloqueo
  // ───────────────────────────────────────────────────────────────
  private iniciarCuentaRegresiva(segundos: number): void {
    if (this.bloqueoTimer) {
      clearInterval(this.bloqueoTimer);
    }
    this.bloqueadoSeg = Math.max(1, Math.floor(segundos));
    this.cdr.markForCheck();

    this.bloqueoTimer = setInterval(() => {
      this.bloqueadoSeg = Math.max(0, this.bloqueadoSeg - 1);
      this.cdr.markForCheck();
      if (this.bloqueadoSeg <= 0) {
        if (this.bloqueoTimer) {
          clearInterval(this.bloqueoTimer);
          this.bloqueoTimer = null;
        }
      }
    }, 1000);
  }

  /** Texto legible del bloqueo para mostrar en el botón. */
  get bloqueoLabel(): string {
    if (this.bloqueadoSeg <= 0) return '';
    const m = Math.floor(this.bloqueadoSeg / 60);
    const s = this.bloqueadoSeg % 60;
    return `Espera ${m}:${s.toString().padStart(2, '0')}`;
  }

  // ───────────────────────────────────────────────────────────────
  // Redirección por rol (async — lee URL pendiente del storage)
  // ───────────────────────────────────────────────────────────────
  private async redirigirPorRol(role: string): Promise<void> {
    const urlPendiente = await this.leerUrlPendiente();
    const destinoAdmin = urlPendiente && urlPendiente.startsWith('/tabs/')
      ? urlPendiente
      : '/tabs/tab1';
    const destinoUser = urlPendiente && urlPendiente.startsWith('/user-tabs/')
      ? urlPendiente
      : '/user-tabs/inicio';

    const destino = role === 'admin' ? destinoAdmin : destinoUser;
    await this.limpiarUrlPendiente();
    this.router.navigateByUrl(destino);
  }

  // Persistencia simple de URL pendiente para volver tras login
  private async guardarUrlPendiente(url: string): Promise<void> {
    await Preferences.set({ key: 'pending_url', value: url });
  }
  private async leerUrlPendiente(): Promise<string | null> {
    const { value } = await Preferences.get({ key: 'pending_url' });
    return value;
  }
  private async limpiarUrlPendiente(): Promise<void> {
    await Preferences.remove({ key: 'pending_url' });
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({ message, duration: 2500, position: 'bottom' });
    await toast.present();
  }
}