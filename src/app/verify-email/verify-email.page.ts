import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonItem, IonInput, IonIcon, IonButton, IonSpinner, ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { keyOutline, arrowBackOutline } from 'ionicons/icons';
import { AuthService, AuthRequestError } from '../services/auth.service';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.page.html',
  styleUrls: ['./verify-email.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonItem, IonInput, IonIcon, IonButton, IonSpinner,
  ],
})
export class VerifyEmailPage implements OnInit {
  code = '';
  enviando = false;
  exito = false;
  errores: { code?: string[] } = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private toastController: ToastController,
    private cdr: ChangeDetectorRef,
  ) {
    addIcons({ 'key-outline': keyOutline, 'arrow-back-outline': arrowBackOutline });
  }

  ngOnInit(): void {
    // Si la URL trae ?code=123456 (enlace desde correo) lo precargamos
    const codeParam = this.route.snapshot.queryParamMap.get('code');
    if (codeParam) {
      this.code = codeParam;
      // Si viene el código completo, verificar automáticamente
      if (/^\d{6}$/.test(this.code)) {
        this.verificar();
      }
    }
  }

  validarCode(): void {
    if (this.errores['code']) delete this.errores['code'];
    if (!this.code) {
      this.errores['code'] = ['El código es obligatorio'];
    } else if (!/^\d{6}$/.test(this.code)) {
      this.errores['code'] = ['Debe ser 6 dígitos'];
    }
    this.cdr.markForCheck();
  }

  get puedeVerificar(): boolean {
    return !this.enviando && !!this.code && !this.errores['code'];
  }

  async verificar(): Promise<void> {
    this.errores = {};
    this.validarCode();
    if (this.errores['code']) return;

    this.enviando = true;
    this.cdr.markForCheck();

    try {
      const resp = await this.auth.verifyEmail(this.code.trim());
      this.exito = true;
      await this.presentToast(resp.message);
    } catch (e: any) {
      if (e instanceof AuthRequestError) {
        if (e.isGone) {
          this.errores = { code: [e.message] };
          await this.presentToast(e.message);
        } else if (e.isValidation) {
          this.errores = { code: [e.message] };
        } else {
          await this.presentToast(e.message);
        }
      } else {
        await this.presentToast('No se pudo conectar con el servidor');
      }
      this.cdr.markForCheck();
    } finally {
      this.enviando = false;
      this.cdr.markForCheck();
    }
  }

  async reenviar(): Promise<void> {
    try {
      const resp = await this.auth.resendVerification();
      await this.presentToast(resp.message);
    } catch (e: any) {
      const msg = e instanceof AuthRequestError ? e.message : 'No se pudo enviar el código';
      await this.presentToast(msg);
    }
  }

  irAPerfil(): void {
    this.router.navigateByUrl('/user-tabs/perfil');
  }

  volver(): void {
    this.router.navigateByUrl('/user-tabs/perfil');
  }

  private async presentToast(message: string): Promise<void> {
    const toast = await this.toastController.create({ message, duration: 3000, position: 'bottom' });
    await toast.present();
  }
}