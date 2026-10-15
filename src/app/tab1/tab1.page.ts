import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButton, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonInput, IonItem, IonIcon, ToastController, AlertController, LoadingController } from '@ionic/angular';
import { ChangeDetectorRef } from '@angular/core'; 
import { addIcons } from 'ionicons';
import { personAdd, createOutline, trashOutline, closeCircle } from 'ionicons/icons';
import { UsuariosService, Usuario } from './usuarios.service';

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

  constructor(
    private toastController: ToastController,
    private alertController: AlertController,
    private cdr: ChangeDetectorRef,
    private usuariosService: UsuariosService,
    private loadingController: LoadingController // <--- INYECTADO AQUÍ
  ) {
    addIcons({ 'person-add': personAdd, 'create-outline': createOutline, 'trash-outline': trashOutline, 'close-circle': closeCircle });
  }

  ionViewWillEnter() {
    this.obtenerUsuarios();
  }

  // Función auxiliar para mostrar el Loading
  async showLoading(message: string) {
    const loading = await this.loadingController.create({
      message: message,
      spinner: 'crescent'
    });
    await loading.present();
    return loading;
  }

  // 1. PETICIÓN GET
  async obtenerUsuarios() {
    const loading = await this.showLoading('Cargando usuarios...');
    try {
      const result = await this.usuariosService.obtenerUsuarios();
      this.usuarios = result.data;
      this.cdr.detectChanges(); 
      
      // Manejo de errores de red (Caché)
      if (result.fromCache) {
        this.presentToast('Sin conexión: Mostrando usuarios guardados.');
      }
    } catch (error: any) {
      // Manejo de errores
      this.presentToast('Error al cargar y no hay datos guardados.');
    } finally {
      // Ocultar loading sin importar qué pase
      await this.loadingController.dismiss();
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

  cerrarModal() { this.isModalOpen = false; }

  // 2. PETICIÓN POST Y 3. PETICIÓN PATCH
  async guardarUsuario() {
    if (!this.usuarioEditando.email || !this.usuarioEditando.password) {
      this.presentToast('Email y contraseña son obligatorios');
      return;
    }

    const loading = await this.showLoading(this.esNuevo ? 'Creando usuario...' : 'Actualizando...');
    try {
      if (this.esNuevo) {
        // POST
        await this.usuariosService.crearUsuario(this.usuarioEditando);
        this.presentToast('Usuario creado correctamente (POST)');
      } else {
        // PATCH
        await this.usuariosService.actualizarUsuario(this.usuarioEditando.id, this.usuarioEditando);
        this.presentToast('Usuario actualizado correctamente (PATCH)');
      }
      this.cerrarModal();
      this.obtenerUsuarios(); // Vuelve a hacer GET para refrescar la tabla
    } catch (error: any) {
      // Manejo de errores del servidor
      this.presentToast(error.response?.data?.message || 'Error en el servidor');
      await this.loadingController.dismiss();
    }
  }

  // 4. PETICIÓN DELETE
  async eliminarUsuario(id: string) {
    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: '¿Estás seguro de que deseas eliminar este usuario?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          handler: async () => {
            const loading = await this.showLoading('Eliminando...');
            try {
              await this.usuariosService.eliminarUsuario(id);
              this.presentToast('Usuario eliminado (DELETE)');
              this.obtenerUsuarios();
            } catch (error: any) {
              this.presentToast(error.response?.data?.message || 'Error al eliminar');
              await this.loadingController.dismiss();
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({ message, duration: 2000, position: 'bottom' });
    toast.present();
  }
}