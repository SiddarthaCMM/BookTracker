import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonItem, IonInput, IonIcon, IonButton, IonSpinner, ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { lockClosedOutline, arrowBackOutline, keyOutline } from 'ionicons/icons';
import { AuthService, AuthRequestError } from '../services/auth.service';
import { FieldErrors } from '../services/auth.models';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonItem, IonInput, IonIcon, IonButton, IonSpinner,
  ],
})
export class ResetPasswordPage implements OnInit {
  code = '';
  password = '';
  confirm_password = '';
  email = '';          // viene del query param (informativo)

  mostrarPassword = false;
  mostrarConfirm = false;
  enviando = false;
  exito = false;

  errores: FieldErrors = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private toastController: ToastController,
    private cdr: ChangeDetectorRef,
  ) {
    addIcons({
      'lock-closed-outline': lockClosedOutline,
      'arrow-back-outline': arrowBackOutline,
      'key-outline': keyOutline,
    });
  }

  ngOnInit(): void {
    // Si la URL trae ?code=123456 (enlace desde correo) lo precargamos
    const codeParam = this.route.snapshot.queryParamMap.get('code');
    if (codeParam) this.code = codeParam;
    const emailParam = this.route.snapshot.queryParamMap.get('email');
    if (emailParam) this.email = emailParam;
  }

  // --- Medidor de fortaleza (idéntico al de register) ---
  get fortaleza(): 'vacia' | 'debil' | 'aceptable' | 'fuerte' {
    const p = this.password;
    if (!p) return 'vacia';
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 2) return 'debil';
    if (score === 3) return 'aceptable';
    return 'fuerte';
  }

  get fortalezaLabel(): string {
    switch (this.fortaleza) {
      case 'debil': return 'Débil';
      case 'aceptable': return 'Aceptable';
      case 'fuerte': return 'Fuerte';
      default: return '';
    }
  }

  // --- Validaciones por campo ---
  validarCampo(campo: 'code' | 'password' | 'confirm_password'): void {
    if (this.errores[campo]) delete this.errores[campo];

    switch (campo) {
      case 'code':
        if (!this.code) {
          this.errores['code'] = ['El código es obligatorio'];
        } else if (!/^\d{6}$/.test(this.code)) {
          this.errores['code'] = ['Debe ser 6 dígitos'];
        }
        break;
      case 'password':
        if (!this.password) {
          this.errores['password'] = ['La contraseña es obligatoria'];
        } else {
          const e: string[] = [];
          if (this.password.length < 8) e.push('Al menos 8 caracteres');
          if (this.password.length > 72) e.push('Máximo 72 caracteres');
          if (!/[A-Za-zÁ-ú]/u.test(this.password)) e.push('Al menos una letra');
          if (!/[0-9]/.test(this.password)) e.push('Al menos un número');
          if (e.length) this.errores['password'] = e;
        }
        if (this.confirm_password) this.validarCampo('confirm_password');
        break;
      case 'confirm_password':
        if (this.confirm_password !== this.password) {
          this.errores['confirm_password'] = ['Las contraseñas no coinciden'];
        }
        break;
    }
    this.cdr.markForCheck();
  }

  get formularioValido(): boolean {
    if (this.enviando) return false;
    if (Object.keys(this.errores).length > 0) return false;
    if (!this.code || !this.password || !this.confirm_password) return false;
    return true;
  }

  async cambiar(): Promise<void> {
    this.errores = {};
    (['code', 'password', 'confirm_password'] as const).forEach((c) => this.validarCampo(c));
    if (Object.keys(this.errores).length > 0) {
      this.cdr.markForCheck();
      return;
    }

    this.enviando = true;
    this.cdr.markForCheck();

    try {
      const resp = await this.auth.restablecerContrasena({
        code: this.code.trim(),
        password: this.password,
        confirm_password: this.confirm_password,
      });
      this.exito = true;
      await this.presentToast(resp.message);
    } catch (e: any) {
      if (e instanceof AuthRequestError) {
        if (e.isGone) {
          // 410: código expirado o ya usado
          await this.presentToast(e.message);
          this.errores = { code: [e.message] };
        } else if (e.isValidation) {
          this.errores = { ...e.errors };
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

  irALogin(): void {
    this.router.navigateByUrl('/login');
  }

  volver(): void {
    this.router.navigateByUrl('/login');
  }

  private async presentToast(message: string): Promise<void> {
    const toast = await this.toastController.create({ message, duration: 3000, position: 'bottom' });
    await toast.present();
  }
}