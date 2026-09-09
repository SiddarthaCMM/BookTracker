import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { triangle, images, square, logOutOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
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
  constructor(private router: Router) {
    // Registramos los íconos de los tabs y el de cerrar sesión
    addIcons({ 
      triangle, 
      images, 
      square, 
      'log-out-outline': logOutOutline 
    });
  }

  cerrarSesion() {
    // Borramos la sesión guardada
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user_id');
    
    // Redirigimos al login
    this.router.navigateByUrl('/login');
  }
}