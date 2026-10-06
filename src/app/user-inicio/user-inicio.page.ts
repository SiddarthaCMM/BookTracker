import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonSearchbar, IonButton, IonButtons, IonIcon, IonSpinner, IonModal, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { searchOutline, checkmarkCircleOutline, bookOutline, cloudDownloadOutline } from 'ionicons/icons';
import { BusquedaService, LibroGoogle } from './busqueda.service';

@Component({
  selector: 'app-user-inicio',
  templateUrl: './user-inicio.page.html',
  styleUrls: ['./user-inicio.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, IonTitle, IonSearchbar, IonButton, IonButtons, IonIcon, IonSpinner, IonModal],
})
export class UserInicioPage {
  query = '';
  resultados: any[] = [];
  cargando = false;
  
  // Control del modal de búsqueda externa
  isModalExternoOpen = false;

  constructor(private busquedaService: BusquedaService, private toastController: ToastController) {
    addIcons({ 
      'search-outline': searchOutline, 
      'checkmark-circle-outline': checkmarkCircleOutline, 
      'book-outline': bookOutline,
      'cloud-download-outline': cloudDownloadOutline
    });
  }

  async buscar(event: any) {
    const query = event.target.value;
    if (query.trim().length < 3) { // Empezar a buscar con 3 letras
      this.resultados = [];
      return;
    }

    this.cargando = true;
    try {
      // 1. Buscamos en la base de datos local
      const internos = await this.busquedaService.buscarEnInterno(query);
      
      if (internos.length > 0) {
        this.resultados = internos;
        this.isModalExternoOpen = false;
      } else {
        // 2. Si no hay locales, abrimos el modal
        this.resultados = [];
        this.isModalExternoOpen = true;
      }
    } catch (error) {
      this.presentToast('Error al buscar libros');
    }
    this.cargando = false;
  }

  async buscarEnGoogle() {
    this.isModalExternoOpen = false; // Cerramos el modal
    this.cargando = true;
    try {
      // 3. Buscamos en la API de Google
      this.resultados = await this.busquedaService.buscarEnGoogle(this.query);
    } catch (error) {
      this.presentToast('Error al buscar en Google Books');
    }
    this.cargando = false;
  }

  cerrarModal() {
    this.isModalExternoOpen = false;
  }

  async agregarLibro(libro: any, estado: string) {
    try {
      // Si es de Google, manda todos los datos. Si es interno, solo manda el ID
      const dataLibro = libro.isbn ? libro : { id: libro.id, titulo: libro.titulo, autor: libro.autor, portada_url: libro.portada_url, paginas_totales: libro.paginas_totales, isbn: libro.isbn };
      
      await this.busquedaService.guardarLibro(dataLibro, estado);
      this.presentToast(`Añadido a "${estado}"`);
    } catch (error) {
      this.presentToast('Error al guardar el libro');
    }
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({ message, duration: 1500, position: 'bottom' });
    toast.present();
  }
}