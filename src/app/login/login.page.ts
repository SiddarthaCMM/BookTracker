import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, ToastController } from '@ionic/angular';
import axios from 'axios'; 

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent
  ],
})
export class LoginPage {
  user = {
    email: '',
    password: ''
  };

  private apiUrl = 'http://127.0.0.1/api/login.php';

  constructor(
    private toastController: ToastController,
    private router: Router
  ) {} // Omitimos HttpClient del constructor

  // Convertimos la función a async para usar await con Axios
  async login(): Promise<void> {
    console.log('Botón presionado, intentando loguear con Axios...');

    try {
      // Axios devuelve la respuesta en el objeto 'response', y el body JSON en 'response.data'
      const response = await axios.post(this.apiUrl, this.user);

      if (response.data.success) {
        // Guardamos el ID del usuario y el estado de login en el localStorage
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('user_id', response.data.user_id);
        
        await this.presentToast('Login exitoso');
        this.router.navigateByUrl('/tabs/tab1');
      } else {
        await this.presentToast('Error: ' + response.data.message);
      }
    } catch (error: any) {
      console.error('Error en la petición de Axios:', error);
      
      // Axios guarda los errores del servidor (como un 401 o 404) dentro de 'error.response'
      if (error.response && error.response.data && error.response.data.message) {
        await this.presentToast(error.response.data.message);
      } else {
        await this.presentToast('Error de conexión con el servidor');
      }
    }
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }
}
