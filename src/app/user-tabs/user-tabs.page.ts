import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { homeOutline, libraryOutline, personOutline, logOutOutline } from 'ionicons/icons';
import { LoginService } from '../login/login.service';

@Component({
  selector: 'app-user-tabs',
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar color="success">
        <ion-title>Mi Lector</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="cerrarSesion()">
            <ion-icon slot="icon-only" name="log-out-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="inicio" href="/user-tabs/inicio">
          <ion-icon name="home-outline"></ion-icon>
          <ion-label>Inicio</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="biblioteca" href="/user-tabs/biblioteca">
          <ion-icon name="library-outline"></ion-icon>
          <ion-label>Biblioteca</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="perfil" href="/user-tabs/perfil">
          <ion-icon name="person-outline"></ion-icon>
          <ion-label>Perfil</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton]
})
export class UserTabsPage {
  constructor(private router: Router, private loginService: LoginService) {
    addIcons({ 'home-outline': homeOutline, 'library-outline': libraryOutline, 'person-outline': personOutline, 'log-out-outline': logOutOutline });
  }

  async cerrarSesion() {
    await this.loginService.cerrarSesion();
    this.router.navigateByUrl('/login');
  }
}