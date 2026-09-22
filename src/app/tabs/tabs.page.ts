import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { triangle, images, square, logOutOutline } from 'ionicons/icons';
import { LoginService } from '../login/login.service'; // Ajusta la ruta

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [
    IonTabs, 
    IonTabBar, 
    IonTabButton, 
    IonIcon, 
    IonLabel,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton
  ],
})
export class TabsPage {
  // Inyectamos el LoginService aquí
  constructor(
    private router: Router,
    private loginService: LoginService 
  ) {
    // Registramos los íconos de los tabs y el de cerrar sesión
    addIcons({ 
      triangle, 
      images, 
      square, 
      'log-out-outline': logOutOutline 
    });
  }

  async cerrarSesion() {
    // Llamamos al servicio para borrar la sesión de Preferences
    await this.loginService.cerrarSesion();
    this.router.navigateByUrl('/login');
  }
}