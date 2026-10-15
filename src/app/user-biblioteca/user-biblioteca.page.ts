import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonList, IonItem, IonThumbnail, IonLabel } from '@ionic/angular';
import { LibrosService } from '../tab2/libros.service';

@Component({
  selector: 'app-user-biblioteca',
  templateUrl: './user-biblioteca.page.html',
  styleUrls: ['./user-biblioteca.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonToolbar, IonTitle, IonList, IonItem, IonThumbnail, IonLabel]
})
export class UserBibliotecaPage {
  libros: any[] = [];

  constructor(private librosService: LibrosService, private cdr: ChangeDetectorRef) {}

  ionViewWillEnter() {
    this.cargarLibros();
  }

  async cargarLibros() {
    try {
      const result = await this.librosService.obtenerLibros();
      this.libros = result.data;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error al cargar biblioteca', error);
    }
  }
}