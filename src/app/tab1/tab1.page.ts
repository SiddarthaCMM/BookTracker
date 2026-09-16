import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButton, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonInput, IonItem, IonIcon, ToastController, AlertController } from '@ionic/angular';
import { ChangeDetectorRef } from '@angular/core'; 
import { addIcons } from 'ionicons';
import { personAdd, createOutline, trashOutline, closeCircle } from 'ionicons/icons';
import { UsuariosService, Usuario } from './usuarios.service'; // Importamos el servicio

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
    private usuariosService: UsuariosService // Inyectamos el servicio
  ) {
    addIcons({ 'person-add': personAdd, 'create-outline': createOutline, 'trash-outline': trashOutline, 'close-circle': closeCircle });
  }

  ionViewWillEnter() {
    this.obtenerUsuarios();
  }

  async obtenerUsuarios() {
    try {
      // Usamos el servicio
      this.usuarios = await this.usuariosService.obtenerUsuarios();
      this.cdr.detectChanges(); 
    } catch (error) {
      this.presentToast('Error al cargar usuarios');
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

  async guardarUsuario() {
    if (!this.usuarioEditando.email || !this.usuarioEditando.password) {
      this.presentToast('Email y contraseña son obligatorios');
      return;
    }

    try {
      if (this.esNuevo) {
        await this.usuariosService.crearUsuario(this.usuarioEditando);
        this.presentToast('Usuario creado correctamente');
      } else {
        await this.usuariosService.actualizarUsuario(this.usuarioEditando.id, this.usuarioEditando);
        this.presentToast('Usuario actualizado correctamente');
      }
      this.cerrarModal();
      this.obtenerUsuarios();
    } catch (error: any) {
      this.presentToast(error.response?.data?.message || 'Error en el servidor');
    }
  }

  async eliminarUsuario(id: string) {
    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: '¿Estás seguro de que deseas eliminar este usuario?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          handler: async () => {
            try {
              await this.usuariosService.eliminarUsuario(id);
              this.presentToast('Usuario eliminado');
              this.obtenerUsuarios();
            } catch (error: any) {
              this.presentToast(error.response?.data?.message || 'Error al eliminar');
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