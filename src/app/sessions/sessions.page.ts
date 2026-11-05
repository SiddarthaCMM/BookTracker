import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonButton, IonIcon, IonSpinner,
  IonRefresher, IonRefresherContent, ToastController, AlertController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { phonePortraitOutline, trashOutline, arrowBackOutline } from 'ionicons/icons';
import axios from 'axios';
import { AuthService } from '../services/auth.service';

interface SesionActiva {
  id: number;
  device_label: string;
  expires_at: string;
  last_used_at: string;
  created_at: string;
  is_current: boolean;
}

@Component({
  selector: 'app-sessions',
  templateUrl: './sessions.page.html',
  styleUrls: ['./sessions.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonList, IonItem, IonLabel, IonButton, IonIcon, IonSpinner,
    IonRefresher, IonRefresherContent,
  ],
})
export class SessionsPage implements OnInit {
  sesiones: SesionActiva[] = [];
  cargando = true;

  constructor(
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
  ) {
    addIcons({
      'phone-portrait-outline': phonePortraitOutline,
      'trash-outline': trashOutline,
      'arrow-back-outline': arrowBackOutline,
    });
  }

  ngOnInit(): void {
    this.cargar();
  }

  async cargar(event?: any): Promise<void> {
    this.cargando = true;
    this.cdr.markForCheck();
    try {
      const res = await axios.get('sessions_api.php');
      this.sesiones = res.data.data ?? [];
    } catch (e: any) {
      await this.presentToast('No se pudieron cargar las sesiones');
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
      event?.target?.complete?.();
    }
  }

  async revocar(s: SesionActiva): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Cerrar sesión',
      message: `¿Cerrar la sesión en "${s.device_label}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Cerrar', role: 'destructive',
          handler: async () => {
            try {
              const res = await axios.delete(`sessions_api.php?id=${s.id}`);
              if (res.data.closed_current) {
                await this.authService.cerrarSesion();
                this.router.navigateByUrl('/login');
              } else {
                await this.presentToast(res.data.message || 'Sesión cerrada');
                await this.cargar();
              }
            } catch (e: any) {
              await this.presentToast('No se pudo cerrar la sesión');
            }
          },
        },
      ],
    });
    await alert.present();
  }

  volver(): void {
    this.router.navigateByUrl('/user-tabs/perfil');
  }

  private async presentToast(message: string): Promise<void> {
    const toast = await this.toastController.create({ message, duration: 2500, position: 'bottom' });
    await toast.present();
  }
}