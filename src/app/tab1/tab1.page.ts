import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButton, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonInput, IonItem, IonIcon, ToastController, AlertController, LoadingController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { personAdd, createOutline, trashOutline, closeCircle } from 'ionicons/icons';
import { Preferences } from '@capacitor/preferences';
import { UsuariosService, Usuario } from './usuarios.service';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 6;

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonButton, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonInput, IonItem, IonIcon],
})
export class Tab1Page {
  usuarios: Usuario[] = [];
  isModalOpen = false;
  usuarioEditando: Usuario = { id: '', email: '', password: '' };
  esNuevo = true;
  private miId = '';

  constructor(
    private toastController: ToastController,
    private alertController: AlertController,
    private cdr: ChangeDetectorRef,
    private usuariosService: UsuariosService,
    private loadingController: LoadingController
  ) {
    addIcons({ 'person-add': personAdd, 'create-outline': createOutline, 'trash-outline': trashOutline, 'close-circle': closeCircle });
  }

  async ionViewWillEnter() {
    const { value } = await Preferences.get({ key: 'user_id' });
    this.miId = value ?? '';
    await this.obtenerUsuarios();
  }

  /** El admin no puede borrarse a sí mismo */
  esYo(u: Usuario): boolean {
    return String(u.id) === this.miId;
  }

  /**
   * Ejecuta una tarea mostrando un loading y lo cierra SIEMPRE (éxito o error).
   * Antes, tras guardar/eliminar el loading quedaba abierto y la pantalla se congelaba.
   */
  private async conLoading<T>(message: string, tarea: () => Promise<T>): Promise<T> {
    const loading = await this.loadingController.create({ message, spinner: 'crescent' });
    await loading.present();
    try {
      return await tarea();
    } finally {
      await loading.dismiss();
    }
  }

  // 1. PETICIÓN GET
  async obtenerUsuarios() {
    try {
      const result = await this.conLoading('Cargando usuarios...', () => this.usuariosService.obtenerUsuarios());
      this.usuarios = result.data;
      this.cdr.markForCheck();
      if (result.fromCache) {
        this.presentToast('Sin conexión: mostrando usuarios guardados.');
      }
    } catch (error: any) {
      this.presentToast(error.response?.data?.message || 'Error al cargar usuarios.');
    }
  }

  abrirModalCrear() {
    this.esNuevo = true;
    this.usuarioEditando = { id: '', email: '', password: '' };
    this.isModalOpen = true;
  }

  abrirModalEditar(usuario: Usuario) {
    this.esNuevo = false;
    this.usuarioEditando = { ...usuario, password: '' };
    this.isModalOpen = true;
  }

  cerrarModal() {
    this.isModalOpen = false;
  }

  // 2. PETICIÓN POST  y  3. PETICIÓN PATCH
  async guardarUsuario() {
    const { email, password } = this.usuarioEditando;

    if (!email || !EMAIL_RE.test(email.trim())) {
      this.presentToast('Escribe un correo válido');
      return;
    }
    // Al crear la contraseña es obligatoria; al editar solo si se quiere cambiar
    if (this.esNuevo && !password) {
      this.presentToast('La contraseña es obligatoria');
      return;
    }
    if (password && password.length < PASSWORD_MIN) {
      this.presentToast(`La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`);
      return;
    }

    try {
      await this.conLoading(this.esNuevo ? 'Creando usuario...' : 'Actualizando...', () =>
        this.esNuevo
          ? this.usuariosService.crearUsuario(this.usuarioEditando)
          : this.usuariosService.actualizarUsuario(this.usuarioEditando.id, this.usuarioEditando)
      );
      this.presentToast(this.esNuevo ? 'Usuario creado correctamente' : 'Usuario actualizado correctamente');
      this.cerrarModal();
      await this.obtenerUsuarios();
    } catch (error: any) {
      this.presentToast(error.response?.data?.message || 'Error en el servidor');
    }
  }

  // 4. PETICIÓN DELETE
  async eliminarUsuario(u: Usuario) {
    if (this.esYo(u)) {
      this.presentToast('No puedes eliminar tu propia cuenta');
      return;
    }
    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: `¿Eliminar a ${u.email}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.conLoading('Eliminando...', () => this.usuariosService.eliminarUsuario(u.id));
              this.presentToast('Usuario eliminado');
              await this.obtenerUsuarios();
            } catch (error: any) {
              this.presentToast(error.response?.data?.message || 'Error al eliminar');
            }
          },
        },
      ],
    });
    await alert.present();
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({ message, duration: 2000, position: 'bottom' });
    await toast.present();
  }
}
