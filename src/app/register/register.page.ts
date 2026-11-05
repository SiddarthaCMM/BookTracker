import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonInput,
  IonIcon,
  IonButton,
  IonCheckbox,
  IonSpinner,
  ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  eyeOutline,
  eyeOffOutline,
  mailOutline,
  personOutline,
  lockClosedOutline,
  calendarOutline,
  arrowBackOutline,
} from 'ionicons/icons';
import { AuthService, AuthRequestError } from '../services/auth.service';
import { RegisterCredentials, FieldErrors } from '../services/auth.models';

// ---------------------------------------------------------------
// Regex de validación (espejo exacto del servidor en register.php)
// ---------------------------------------------------------------
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonInput,
    IonIcon,
    IonButton,
    IonCheckbox,
    IonSpinner,
  ],
})
export class RegisterPage {
  // Modelo del formulario
  form: RegisterCredentials = {
    email: '',
    username: '',
    password: '',
    confirm_password: '',
    birth_date: '',
    accept_terms: false,
  };

  // Estado de UI
  mostrarPassword = false;
  mostrarConfirm = false;
  enviando = false;

  // Errores por campo: del cliente durante edición, o del servidor al enviar.
  errores: FieldErrors = {};

  constructor(
    private auth: AuthService,
    private router: Router,
    private toastController: ToastController,
    private cdr: ChangeDetectorRef,
  ) {
    addIcons({
      'eye-outline': eyeOutline,
      'eye-off-outline': eyeOffOutline,
      'mail-outline': mailOutline,
      'person-outline': personOutline,
      'lock-closed-outline': lockClosedOutline,
      'calendar-outline': calendarOutline,
      'arrow-back-outline': arrowBackOutline,
    });
  }

  // ---------------------------------------------------------------
  // Medidor de fortaleza (solo informativo)
  // ---------------------------------------------------------------
  get fortaleza(): 'vacia' | 'debil' | 'aceptable' | 'fuerte' {
    const p = this.form.password;
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

  // ---------------------------------------------------------------
  // Validación por campo (cliente) — se ejecuta en cada cambio
  // ---------------------------------------------------------------
  validarCampo(campo: keyof RegisterCredentials): void {
    if (this.errores[campo]) {
      delete this.errores[campo];
    }

    switch (campo) {
      case 'email':
        if (!this.form.email) {
          this.errores['email'] = ['El correo es obligatorio'];
        } else if (this.form.email.length > 254) {
          this.errores['email'] = ['El correo es demasiado largo'];
        } else if (!EMAIL_RE.test(this.form.email)) {
          this.errores['email'] = ['El correo no es válido'];
        }
        break;
      case 'username':
        if (!this.form.username) {
          this.errores['username'] = ['El nombre de usuario es obligatorio'];
        } else if (!USERNAME_RE.test(this.form.username)) {
          this.errores['username'] = ['3 a 20 caracteres: letras, números y guion bajo'];
        }
        break;
      case 'password':
        if (!this.form.password) {
          this.errores['password'] = ['La contraseña es obligatoria'];
        } else {
          const e: string[] = [];
          if (this.form.password.length < 8) e.push('Al menos 8 caracteres');
          if (this.form.password.length > 72) e.push('Máximo 72 caracteres');
          if (!/[A-Za-zÁ-ú]/u.test(this.form.password)) e.push('Al menos una letra');
          if (!/[0-9]/.test(this.form.password)) e.push('Al menos un número');
          if (e.length) this.errores['password'] = e;
        }
        if (this.form.confirm_password) this.validarCampo('confirm_password');
        break;
      case 'confirm_password':
        if (this.form.confirm_password !== this.form.password) {
          this.errores['confirm_password'] = ['Las contraseñas no coinciden'];
        }
        break;
      case 'birth_date':
        if (this.form.birth_date) {
          const d = new Date(this.form.birth_date + 'T00:00:00');
          const hoy = new Date();
          hoy.setHours(0, 0, 0, 0);
          if (isNaN(d.getTime())) {
            this.errores['birth_date'] = ['Fecha inválida'];
          } else if (d > hoy) {
            this.errores['birth_date'] = ['La fecha no puede ser futura'];
          }
        }
        break;
    }
    this.cdr.markForCheck();
  }

  /** Valida también que se hayan aceptado los términos antes de enviar. */
  get formularioValido(): boolean {
    if (this.enviando) return false;
    if (!this.form.accept_terms) return false;
    if (Object.keys(this.errores).length > 0) return false;
    if (!this.form.email || !this.form.username || !this.form.password || !this.form.confirm_password) {
      return false;
    }
    return true;
  }

  // ---------------------------------------------------------------
  // Envío
  // ---------------------------------------------------------------
  async registrar(): Promise<void> {
    this.errores = {};

    (['email', 'username', 'password', 'confirm_password', 'birth_date'] as (keyof RegisterCredentials)[])
      .forEach((c) => this.validarCampo(c));

    if (!this.form.accept_terms) {
      this.errores['accept_terms'] = ['Debes aceptar los términos y la política de privacidad'];
      this.cdr.markForCheck();
      return;
    }

    if (Object.keys(this.errores).length > 0) {
      this.cdr.markForCheck();
      return;
    }

    this.enviando = true;
    this.cdr.markForCheck();

    try {
      const response = await this.auth.register({
        ...this.form,
        birth_date: this.form.birth_date || undefined,
      });

      if (response.success && response.user_id && response.token && response.role) {
        await this.auth.guardarSesion(response.user_id, response.token, response.role);
        await this.presentToast('Cuenta creada correctamente');
        this.router.navigateByUrl('/user-tabs/inicio');
      } else {
        await this.presentToast(response.message || 'No se pudo crear la cuenta');
      }
    } catch (e: any) {
      if (e instanceof AuthRequestError) {
        if (e.isRateLimited) {
          await this.presentToast(e.message);
        } else if (e.isValidation || e.isConflict) {
          this.errores = { ...e.errors };
          if (!Object.keys(this.errores).length) {
            await this.presentToast(e.message);
          }
        } else {
          await this.presentToast(e.message);
        }
      } else {
        await this.presentToast('Error de red o de servidor');
      }
      this.cdr.markForCheck();
    } finally {
      this.enviando = false;
      this.cdr.markForCheck();
    }
  }

  volver(): void {
    this.router.navigateByUrl('/login');
  }

  private async presentToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      position: 'bottom',
    });
    await toast.present();
  }
}