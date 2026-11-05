import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonBadge, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { peopleOutline, libraryOutline, statsChartOutline, logOutOutline, cloudOfflineOutline } from 'ionicons/icons';
import { LoginService } from '../login/login.service';
import { NetworkService } from '../network.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [CommonModule, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonBadge],
})
export class TabsPage implements OnInit {
  isOnline = true;

  private destroyRef = inject(DestroyRef);
  private estadoPrevio: boolean | null = null;

  constructor(
    private router: Router,
    private loginService: LoginService,
    private networkService: NetworkService,
    private toastController: ToastController,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
  ) {
    addIcons({
      'people-outline': peopleOutline,
      'library-outline': libraryOutline,
      'stats-chart-outline': statsChartOutline,
      'log-out-outline': logOutOutline,
      'cloud-offline-outline': cloudOfflineOutline,
    });
  }

  ngOnInit() {
    // takeUntilDestroyed evita fugas: antes la suscripción nunca se cancelaba
    this.networkService.isOnline$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(async (status) => {
      this.isOnline = status;
      this.cdr.markForCheck();

      if (status === this.estadoPrevio) {
        return;
      }
      const esPrimeraEmision = this.estadoPrevio === null;
      this.estadoPrevio = status;

      // Al abrir la app con internet no hace falta avisar nada
      if (esPrimeraEmision && status) {
        return;
      }
      await this.presentToast(status ? 'Conexión recuperada.' : 'Sin conexión: modo offline activado.');
    });
  }

  async cerrarSesion() {
    await this.authService.cerrarSesion();
    this.router.navigateByUrl('/login');
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({ message, duration: 2000, position: 'bottom' });
    await toast.present();
  }
}
