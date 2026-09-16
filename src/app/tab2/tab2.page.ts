import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButton, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonInput, IonItem, IonIcon, IonSelect, IonSelectOption, ToastController, AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { bookOutline, createOutline, trashOutline, closeCircle, addCircleOutline } from 'ionicons/icons';
import { LibrosService, Libro } from './libros.service'; // Importamos el servicio

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonButton, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonInput, IonItem, IonIcon, IonSelect, IonSelectOption],
})
export class Tab2Page {
  libros: Libro[] = [];
  isModalOpen = false;
  libroEditando: Libro = { titulo: '', autor: '', isbn: '', paginas_totales: 0, estado: 'Pendiente', portada_url: '' };
  esNuevo = true;

  constructor(
    private toastController: ToastController,
    private alertController: AlertController,
    private cdr: ChangeDetectorRef,
    private librosService: LibrosService // Inyectamos el servicio
  ) {
    addIcons({ 'book-outline': bookOutline, 'create-outline': createOutline, 'trash-outline': trashOutline, 'close-circle': closeCircle, 'add-circle-outline': addCircleOutline });
  }

  ionViewWillEnter() {
    this.obtenerLibros();
  }

  async obtenerLibros() {
    try {
      // Usamos el servicio
      this.libros = await this.librosService.obtenerLibros();
      this.cdr.detectChanges();
    } catch (error) {
      this.presentToast('Error al cargar libros');
    }
  }

  abrirModalCrear() {
    this.esNuevo = true;
    this.libroEditando = { titulo: '', autor: '', isbn: '', paginas_totales: 0, estado: 'Pendiente', portada_url: '' };
    this.isModalOpen = true;
  }

  abrirModalEditar(libro: Libro) {
    this.esNuevo = false;
    this.libroEditando = { ...libro };
    this.isModalOpen = true;
  }

  cerrarModal() { this.isModalOpen = false; }

  async guardarLibro() {
    if (!this.libroEditando.titulo || !this.libroEditando.autor) {
      this.presentToast('Título y autor son obligatorios');
      return;
    }

    try {
      if (this.esNuevo) {
        await this.librosService.crearLibro(this.libroEditando);
        this.presentToast('Libro añadido a tu estantería');
      } else {
        await this.librosService.actualizarLibro(this.libroEditando.id || '', this.libroEditando);
        this.presentToast('Progreso actualizado');
      }
      this.cerrarModal();
      this.obtenerLibros();
    } catch (error: any) {
      this.presentToast(error.response?.data?.message || 'Error en el servidor');
    }
  }

  async eliminarLibro(id: string) {
    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: '¿Eliminar este libro de tu estantería?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          handler: async () => {
            try {
              await this.librosService.eliminarLibro(id);
              this.presentToast('Libro eliminado');
              this.obtenerLibros();
            } catch (error) {
              this.presentToast('Error al eliminar');
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