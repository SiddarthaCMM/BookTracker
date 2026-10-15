import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, ToastController, IonButtons, IonButton, IonIcon, IonModal, IonInput, IonItem } from '@ionic/angular';
import { LoginService, UserCredentials } from './login.service';
import { Preferences } from '@capacitor/preferences';
import axios from 'axios'; // Importamos axios para configurarlo globalmente
import { addIcons } from 'ionicons';
import { settingsOutline } from 'ionicons/icons';

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

  constructor(
    private toastController: ToastController,
    private router: Router,
    private loginService: LoginService
  ) {
    addIcons({ 'settings-outline': settingsOutline });
  }

  async abrirConfig() {
    // Leemos la IP guardada, si no hay, ponemos 127.0.0.1 por defecto
    const { value } = await Preferences.get({ key: 'api_ip' });
    this.ipInput = value || '127.0.0.1';
    this.isConfigOpen = true;
  }

  cerrarConfig() {
    this.isConfigOpen = false;
  }

  async guardarIp() {
    // Guardamos la nueva IP
    await Preferences.set({ key: 'api_ip', value: this.ipInput });
    // Configuramos Axios para usar la nueva IP en todo el app
    axios.defaults.baseURL = `http://${this.ipInput}/api/`;
    this.cerrarConfig();
    await this.presentToast('IP actualizada correctamente');
  }

  async login(): Promise<void> {
    try {
      const response = await this.loginService.login(this.user);

      if (response.success && response.user_id && response.token && response.role) {
        await this.loginService.guardarSesion(response.user_id, response.token, response.role);
        await this.presentToast('Login exitoso');
        
        if (response.role === 'admin') {
          this.router.navigateByUrl('/tabs/tab1');
        } else {
          this.router.navigateByUrl('/user-tabs');
        }
      } else {
        await this.presentToast('Error: ' + response.message);
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        await this.presentToast(error.response.data.message);
      } else {
        await this.presentToast('Error de conexión con el servidor');
      }
    }
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message, duration: 2000, position: 'bottom'
    });
    await toast.present();
  }
}