import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonBadge, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { triangle, images, square, logOutOutline, cloudOfflineOutline } from 'ionicons/icons';
import { LoginService } from '../login/login.service';
import { NetworkService } from '../network.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonTabs, 
    IonTabBar, 
    IonTabButton, 
    IonIcon, 
    IonLabel, 
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonButtons, 
    IonButton, 
    IonBadge
  ],
})
export class TabsPage implements OnInit {
  isOnline = true;

  constructor(
    private router: Router,
    private loginService: LoginService,
    private networkService: NetworkService,
    private toastController: ToastController,
    private cdr: ChangeDetectorRef // <--- INYECTADO AQUÍ
  ) {
    addIcons({ 
      triangle, 
      images, 
      square, 
      'log-out-outline': logOutOutline, 
      'cloud-offline-outline': cloudOfflineOutline
    });
  }

  ngOnInit() {
    this.networkService.isOnline$.subscribe(async (status) => {
      this.isOnline = status;
      
      // LE DECIMOS A ANGULAR: "Oye, acabo de cambiar la variable isOnline, actualiza la pantalla AHORA"
      this.cdr.detectChanges(); 
      
      if (!status) {
        await this.presentToast('Sin conexión: Modo Offline activado.');
      } else {
        await this.presentToast('Conexión recuperada: Sincronizando datos...');
      }
    });
  }

  async cerrarSesion() {
    await this.loginService.cerrarSesion();
    this.router.navigateByUrl('/login');
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({ message, duration: 2000, position: 'bottom' });
    toast.present();
  }
}