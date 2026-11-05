import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonSearchbar, IonButton, IonButtons, IonIcon, IonSpinner, IonModal, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { searchOutline, checkmarkCircleOutline, bookOutline, cloudDownloadOutline, addOutline } from 'ionicons/icons';
import { BusquedaService, LibroExterno } from './busqueda.service';

@Component({
  selector: 'app-user-inicio',
  templateUrl: './user-inicio.page.html',
  styleUrls: ['./user-inicio.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, IonTitle, IonSearchbar, IonButton, IonButtons, IonIcon, IonSpinner, IonModal],
})
export class UserInicioPage {
  query = '';
  resultados: LibroExterno[] = [];
  cargando = false;

  // Control del modal de búsqueda externa
  isModalExternoOpen = false;

  // Evita que una respuesta lenta pise a una búsqueda más reciente
  private busquedaId = 0;

  constructor(
    private busquedaService: BusquedaService,
    private toastController: ToastController,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      'search-outline': searchOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'book-outline': bookOutline,
      'cloud-download-outline': cloudDownloadOutline,
      'add-outline': addOutline,
    });
  }

  async buscar(event: any) {
    // ion-searchbar puede mandar null/undefined al limpiar: antes eso lanzaba un error en .trim()
    const query: string = (event?.detail?.value ?? event?.target?.value ?? '').toString();
    this.query = query;
    const id = ++this.busquedaId;

    if (query.trim().length < 3) {
      this.resultados = [];
      this.isModalExternoOpen = false;
      this.cargando = false;
      this.cdr.markForCheck();
      return;
    }

    this.cargando = true;
    this.cdr.markForCheck();
    try {
      // 1. Buscamos primero en la base de datos local
      const internos = await this.busquedaService.buscarEnInterno(query.trim());
      if (id !== this.busquedaId) {
        return; // llegó una búsqueda más nueva
      }

      if (internos.length > 0) {
        this.resultados = internos;
        this.isModalExternoOpen = false;
      } else {
        // 2. Si no hay resultados locales, ofrecemos buscar fuera
        this.resultados = [];
        this.isModalExternoOpen = true;
      }
    } catch (error) {
      if (id === this.busquedaId) {
        this.presentToast('Error al buscar libros');
      }
    } finally {
      if (id === this.busquedaId) {
        this.cargando = false;
        this.cdr.markForCheck();
      }
    }
  }

  async buscarEnExterno() {
    const query = this.query.trim();
    if (query.length < 3) {
      this.presentToast('Escribe al menos 3 letras para buscar');
      return;
    }

    this.isModalExternoOpen = false;
    this.cargando = true;
    this.cdr.markForCheck();
    try {
      this.resultados = await this.busquedaService.buscarEnExterno(query);
      if (this.resultados.length === 0) {
        this.presentToast('No se encontraron resultados externos');
      }
    } catch (error) {
      console.error('Error en búsqueda externa:', error);
      this.presentToast('Error al buscar en Open Library. Revisa tu conexión.');
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  cerrarModal() {
    this.isModalExternoOpen = false;
    this.cdr.markForCheck();
  }

  async agregarLibro(libro: LibroExterno, estado: string) {
    try {
      await this.busquedaService.guardarLibro(libro, estado);
      this.presentToast(`Añadido a "${estado}"`);
    } catch (error: any) {
      this.presentToast(error.response?.data?.message || 'Error al guardar el libro');
    }
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({ message, duration: 1500, position: 'bottom' });
    await toast.present();
  }
}
