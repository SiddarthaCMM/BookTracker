import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButton, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonInput, IonItem, IonIcon, IonSelect, IonSelectOption, ToastController, AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { bookOutline, createOutline, trashOutline, closeCircle, addCircleOutline } from 'ionicons/icons';
import { LibrosService, Libro, normalizarLibro } from './libros.service';

const LIBRO_VACIO = (): Libro => ({
  titulo: '',
  autor: '',
  isbn: '',
  paginas_totales: 0,
  paginas_leidas: 0,
  estado: 'Pendiente',
  calificacion: 0,
  portada_url: '',
});

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
  libroEditando: Libro = LIBRO_VACIO();
  esNuevo = true;
  guardando = false;

  constructor(
    private toastController: ToastController,
    private alertController: AlertController,
    private cdr: ChangeDetectorRef,
    private librosService: LibrosService
  ) {
    addIcons({ 'book-outline': bookOutline, 'create-outline': createOutline, 'trash-outline': trashOutline, 'close-circle': closeCircle, 'add-circle-outline': addCircleOutline });
  }

  ionViewWillEnter() {
    this.obtenerLibros();
  }

  async obtenerLibros() {
    try {
      const result = await this.librosService.obtenerLibros();
      this.libros = result.data;
      this.cdr.markForCheck();
      if (result.fromCache) {
        this.presentToast('Sin conexión: mostrando libros guardados localmente.');
      }
    } catch (error: any) {
      this.presentToast(error.response?.data?.message || 'Error al cargar libros.');
    }
  }

  abrirModalCrear() {
    this.esNuevo = true;
    this.libroEditando = LIBRO_VACIO();
    this.isModalOpen = true;
  }

  abrirModalEditar(libro: Libro) {
    this.esNuevo = false;
    this.libroEditando = normalizarLibro(libro);
    this.isModalOpen = true;
  }

  cerrarModal() {
    this.isModalOpen = false;
  }

  async guardarLibro() {
    if (this.guardando) {
      return;
    }
    const l = this.libroEditando;
    l.titulo = (l.titulo ?? '').trim();
    l.autor = (l.autor ?? '').trim();

    if (!l.titulo || !l.autor) {
      this.presentToast('Título y autor son obligatorios');
      return;
    }

    // ion-input type="number" puede devolver texto: lo normalizamos y validamos
    l.paginas_totales = Math.max(0, Math.floor(Number(l.paginas_totales) || 0));
    l.paginas_leidas = Math.max(0, Math.floor(Number(l.paginas_leidas) || 0));
    l.calificacion = Number(l.calificacion) || 0;

    if (l.paginas_totales > 0 && l.paginas_leidas > l.paginas_totales) {
      this.presentToast('Las páginas leídas no pueden superar las páginas totales');
      return;
    }
    // Si lo marca como leído, el progreso queda completo
    if (l.estado === 'Leído' && l.paginas_totales > 0) {
      l.paginas_leidas = l.paginas_totales;
    }

    this.guardando = true;
    try {
      if (this.esNuevo) {
        await this.librosService.crearLibro(l);
        this.presentToast('Libro añadido a tu estantería');
      } else {
        await this.librosService.actualizarLibro(l.id || '', l);
        this.presentToast('Libro actualizado');
      }
      this.cerrarModal();
      await this.obtenerLibros();
    } catch (error: any) {
      this.presentToast(error.response?.data?.message || 'Error en el servidor');
    } finally {
      this.guardando = false;
    }
  }

  async eliminarLibro(libro: Libro) {
    if (!libro.id) {
      return;
    }
    const id = libro.id;
    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: `¿Eliminar "${libro.titulo}" de tu estantería?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.librosService.eliminarLibro(id);
              this.presentToast('Libro eliminado');
              await this.obtenerLibros();
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
