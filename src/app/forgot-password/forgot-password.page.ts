import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonItem, IonInput, IonIcon, IonButton, IonSpinner, ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { mailOutline, arrowBackOutline } from 'ionicons/icons';
import { AuthService, AuthRequestError } from '../services/auth.service';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonItem, IonInput, IonIcon, IonButton, IonSpinner,
  ],
})
export class ForgotPasswordPage {
  email = '';
  enviando = false;
  enviado = false;          // true tras enviar (muestra mensaje de confirmación)
  errores: { email?: string[] } = {};
  devCode: string | null = null;  // solo DEV

  constructor(
    private auth: AuthService,
    private router: Router,
    private toastController: ToastController,
    private cdr: ChangeDetectorRef,
  ) {
    addIcons({ 'mail-outline': mailOutline, 'arrow-back-outline': arrowBackOutline });
  }

  validarEmail(): void {
    if (this.errores['email']) delete this.errores['email'];
    if (!this.email) {
      this.errores['email'] = ['El correo es obligatorio'];
    } else if (this.email.length > 254) {
      this.errores['email'] = ['El correo es demasiado largo'];
    } else if (!EMAIL_RE.test(this.email)) {
      this.errores['email'] = ['El correo no es válido'];
    }
    this.cdr.markForCheck();
  }

  get puedeEnviar(): boolean {
    return !this.enviando && !!this.email && !this.errores['email'];
  }

  async enviar(): Promise<void> {
    this.errores = {};
    this.validarEmail();
    if (this.errores['email']) return;

    this.enviando = true;
    this.cdr.markForCheck();

    try {
      const resp = await this.auth.solicitarRecuperacion(this.email.trim().toLowerCase());
      this.enviado = true;
      this.devCode = resp.dev_code ?? null;
      await this.presentToast(resp.message);
    } catch (e: any) {
      if (e instanceof AuthRequestError) {
        if (e.isValidation && e.errors['email']) {
          this.errores = { email: e.errors['email'] };
        } else {
          await this.presentToast(e.message);
        }
      } else {
        await this.presentToast('No se pudo conectar con el servidor');
      }
    } finally {
      this.enviando = false;
      this.cdr.markForCheck();
    }
  }

  irAReset(): void {
    this.router.navigate(['/reset-password'], { queryParams: { email: this.email } });
  }

  volver(): void {
    this.router.navigateByUrl('/login');
  }

  private async presentToast(message: string): Promise<void> {
    const toast = await this.toastController.create({ message, duration: 3000, position: 'bottom' });
    await toast.present();
  }
}