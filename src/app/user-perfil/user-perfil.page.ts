import { Component, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonInput, IonItem, IonSelect, IonSelectOption, ToastController, IonModal, IonButtons } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { cameraOutline, saveOutline, bluetoothOutline, personCircleOutline } from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { PerfilService } from './perfil.service';
import { BluetoothService } from '../services/Bluetooth.service';
// Importamos el SDK de PhotoEditor
import { PhotoEditorSDKUI } from 'photoeditorsdk';

@Component({
  selector: 'app-user-perfil',
  templateUrl: './user-perfil.page.html',
  styleUrls: ['./user-perfil.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonInput, IonItem, IonSelect, IonSelectOption, IonModal, IonButtons]
})
export class UserPerfilPage {
  @ViewChild('editorContainer') editorContainer!: ElementRef;

  perfil = { username: '', nombre: '', email: '', birth_date: '', idioma: 'es', foto_url: '' };
  dispositivoConectado: string | null = null;

  isEditorOpen = false;
  private editorInstance: any;

  constructor(
    private perfilService: PerfilService,
    private toastController: ToastController,
    private cdr: ChangeDetectorRef,
    private bluetoothService: BluetoothService
  ) {
    // Agrégalo aquí adentro
    addIcons({ 
      'camera-outline': cameraOutline, 
      'save-outline': saveOutline,
      'bluetooth-outline': bluetoothOutline,
      'person-circle-outline': personCircleOutline // <--- AGREGA ESTA LÍNEA
    });
  }

  ionViewWillEnter() { this.cargarPerfil(); }

  async cargarPerfil() {
    try {
      const data = await this.perfilService.getPerfil();
      this.perfil = data;
      this.cdr.detectChanges(); 
    } catch (error) { this.presentToast('Error al cargar perfil'); }
  }

  async tomarFoto() {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt,
        correctOrientation: true
      });
      
      const imageBase64 = 'data:image/jpeg;base64,' + photo.base64String;
      this.abrirPhotoEditor(imageBase64);

    } catch (error) {
      console.log('Cámara cancelada');
    }
  }

  // Variable temporal para guardar la imagen antes de abrir el modal
  imagenParaEditor: string = '';

  // --- LÓGICA DE PHOTOEDITOR SDK ---
  abrirPhotoEditor(imageDataUrl: string) {
    this.imagenParaEditor = imageDataUrl;
    this.isEditorOpen = true;
    // El modal se abre, y cuando termine de abrirse, llamará a inicializarEditor()
  }

  async inicializarEditor() {
    try {
      // Verificamos que el contenedor ya exista
      if (!this.editorContainer) {
        this.presentToast('Error al cargar el contenedor del editor');
        return;
      }

      // Inicializar el SDK de img.ly
      this.editorInstance = await PhotoEditorSDKUI.init({
        container: this.editorContainer.nativeElement,
        image: this.imagenParaEditor, // Usamos la variable temporal
        license: '', 
        theme: 'dark',
        responsive: true,
        tools: ['crop', 'filter', 'adjust', 'text', 'brush'] as any,
        export: {
          image: {
            format: 'image/jpeg' as any,
            quality: 0.8
          }
        }
      } as any);

      // Escuchar cuando el usuario exporta la imagen editada
      this.editorInstance.on('export', (result: any) => {
        this.perfil.foto_url = result.image;
        this.cerrarPhotoEditor();
      });

    } catch (error) {
      console.error('Error al inicializar PhotoEditor SDK', error);
      this.presentToast('No se pudo abrir el editor de fotos');
      this.cerrarPhotoEditor();
    }
  }

  cerrarPhotoEditor() {
    if (this.editorInstance) {
      this.editorInstance.dispose(); // Limpiar el SDK de la memoria
      this.editorInstance = null;
    }
    this.isEditorOpen = false;
    this.cdr.detectChanges();
  }

  async guardar() {
    try {
      await this.perfilService.actualizarPerfil(this.perfil);
      this.presentToast('Perfil actualizado correctamente');
      this.cargarPerfil(); 
    } catch (error) { this.presentToast('Error al guardar'); }
  }

  // --- LÓGICA DE BLUETOOTH ---
  async conectarLector() {
    const toast = await this.toastController.create({ message: 'Buscando lectores Bluetooth...', duration: 1500 });
    await toast.present();
    const listo = await this.bluetoothService.inicializarBluetooth();
    if (listo) {
      try {
        const device = await this.bluetoothService.solicitarDispositivo();
        if (device && device.name) {
          this.dispositivoConectado = device.name;
          this.presentToast(`Conectado a ${device.name}. Sincronizando progreso...`);
        }
      } catch (error) { this.presentToast('No se seleccionó ningún dispositivo'); }
    } else { this.presentToast('El Bluetooth no está disponible'); }
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({ message, duration: 2000, position: 'bottom' });
    await toast.present();
  }
}