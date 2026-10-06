import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, ToastController } from '@ionic/angular';
import { LoginService, UserCredentials } from './login.service';

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
    private loginService: LoginService
  ) {}

  async login(): Promise<void> {
    try {
      const response = await this.loginService.login(this.user);

      // Verificamos que la respuesta incluya el rol
      if (response.success && response.user_id && response.token && response.role) {
        
        // Guardamos la sesión incluyendo el rol
        await this.loginService.guardarSesion(response.user_id, response.token, response.role);
        
        await this.presentToast('Login exitoso');
        
        // REDIRECCIÓN SEGÚN EL ROL
        if (response.role === 'admin') {
          this.router.navigateByUrl('/tabs/tab1'); // Tabs de administrador
        } else {
          this.router.navigateByUrl('/user-tabs'); // Tabs de usuario común
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