import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, ToastController, IonButtons, IonButton, IonIcon, IonModal, IonInput, IonItem } from '@ionic/angular';
import { LoginService, UserCredentials } from './login.service';
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
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, IonModal, IonInput, IonItem],
})
export class LoginPage {
  user: UserCredentials = { email: '', password: '' };
  isConfigOpen = false;
  ipInput = '';
  private enviando = false;

  constructor(
    private toastController: ToastController,
    private router: Router,
    private loginService: LoginService,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({ 'settings-outline': settingsOutline });
  }

  async abrirConfig() {
    // Muestra la IP guardada (vacío = usa la de environment)
    const { value } = await Preferences.get({ key: 'api_ip' });
    this.ipInput = value || '';
    this.isConfigOpen = true;
    this.cdr.markForCheck(); // la app es zoneless: sin esto el modal no se abre tras el await
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

  async login(): Promise<void> {
    if (this.enviando) {
      return; // evita doble envío
    }
    const email = this.user.email.trim();
    if (!email || !this.user.password) {
      await this.presentToast('Escribe tu correo y contraseña');
      return;
    }

    this.enviando = true;
    try {
      const response = await this.loginService.login({ email, password: this.user.password });

      if (response.success && response.user_id && response.token && response.role) {
        await this.loginService.guardarSesion(response.user_id, response.token, response.role);
        this.user.password = '';
        await this.presentToast('Login exitoso');
        this.router.navigateByUrl(response.role === 'admin' ? '/tabs/tab1' : '/user-tabs');
      } else {
        await this.presentToast('Error: ' + (response.message || 'credenciales inválidas'));
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        await this.presentToast(error.response.data.message);
      } else if (error.code === 'ECONNABORTED') {
        await this.presentToast('El servidor tardó demasiado en responder');
      } else {
        await this.presentToast('Error de conexión con el servidor');
      }
    } finally {
      this.enviando = false;
    }
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({ message, duration: 2000, position: 'bottom' });
    await toast.present();
  }
}
