import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, ToastController } from '@ionic/angular';
import { LoginService, UserCredentials } from './login.service'; // Importamos el servicio

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent],
})
export class LoginPage {
  user: UserCredentials = { email: '', password: '' };

  constructor(
    private toastController: ToastController,
    private router: Router,
    private loginService: LoginService // Inyectamos el servicio
  ) {}

  async login(): Promise<void> {
    try {
      // Usamos el servicio en lugar de Axios
      const response = await this.loginService.login(this.user);

      if (response.success) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('user_id', response.user_id || '');
        localStorage.setItem('auth_token', response.token || '');
        
        await this.presentToast('Login exitoso');
        this.router.navigateByUrl('/tabs/tab1');
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