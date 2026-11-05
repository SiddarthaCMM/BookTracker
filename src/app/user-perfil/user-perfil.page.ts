import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonInput, IonItem, IonSelect, IonSelectOption, ToastController, IonModal, IonButtons } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { cameraOutline, saveOutline, bluetoothOutline, personCircleOutline } from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Preferences } from '@capacitor/preferences';
import { PerfilService, Perfil } from './perfil.service';
import { BluetoothService } from '../services/Bluetooth.service';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EDITOR_CONTAINER_ID = 'pesdk-container';

@Component({
  selector: 'app-user-perfil',
  templateUrl: './user-perfil.page.html',
  styleUrls: ['./user-perfil.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonInput, IonItem, IonSelect, IonSelectOption, IonModal, IonButtons],
})
export class UserPerfilPage {
  perfil: Perfil = { username: '', nombre: '', email: '', birth_date: '', idioma: 'es', foto_url: '' };
  dispositivoConectado: string | null = null;

  isEditorOpen = false;
  guardando = false;

  private imagenParaEditor = '';
  private editorInstance: any = null;
  private editorToken = 0; // invalida inicializaciones que terminan después de cerrar el modal

  constructor(
    private perfilService: PerfilService,
    private toastController: ToastController,
    private cdr: ChangeDetectorRef,
    private bluetoothService: BluetoothService
  ) {
    addIcons({
      'camera-outline': cameraOutline,
      'save-outline': saveOutline,
      'bluetooth-outline': bluetoothOutline,
      'person-circle-outline': personCircleOutline,
    });
  }

  ionViewWillEnter() {
    this.cargarPerfil();
    this.dispositivoConectado = this.bluetoothService.dispositivoActual?.name ?? null;
  }

  ionViewWillLeave() {
    // Si se sale de la pantalla con el editor abierto, liberamos sus recursos
    this.cerrarPhotoEditor();
  }

  async cargarPerfil() {
    try {
      const data = await this.perfilService.getPerfil();
      // Mezclamos con los valores por defecto: la API puede devolver null en campos vacíos
      this.perfil = {
        username: data?.username ?? '',
        nombre: data?.nombre ?? '',
        email: data?.email ?? '',
        birth_date: data?.birth_date ?? '',
        idioma: data?.idioma ?? 'es',
        foto_url: data?.foto_url ?? '',
      };
      this.cdr.markForCheck();
    } catch (error) {
      this.presentToast('Error al cargar perfil');
    }
  }

  // --- FOTO + EDITOR ---
  async tomarFoto() {
    try {
      const photo = await Camera.getPhoto({
        quality: 85,
        width: 1280, // reduce el tamaño: la foto se guarda en la base de datos como texto
        allowEditing: false,
        resultType: CameraResultType.DataUrl, // ya incluye el prefijo data:image/...;base64,
        source: CameraSource.Prompt,
        correctOrientation: true,
      });

      if (!photo.dataUrl) {
        this.presentToast('No se pudo leer la imagen');
        return;
      }
      this.abrirPhotoEditor(photo.dataUrl);
    } catch (error: any) {
      // Cancelar el selector no es un error; lo demás (permisos, cámara) sí se avisa
      const mensaje = String(error?.message ?? error).toLowerCase();
      if (!mensaje.includes('cancel')) {
        console.error('Error de cámara', error);
        this.presentToast('No se pudo abrir la cámara o la galería. Revisa los permisos.');
      }
    }
  }

  abrirPhotoEditor(imageDataUrl: string) {
    this.imagenParaEditor = imageDataUrl;
    this.isEditorOpen = true;
    this.cdr.markForCheck();
    // Cuando el modal termina de abrirse se dispara (didPresent) -> inicializarEditor()
  }

  async inicializarEditor() {
    const token = ++this.editorToken;
    try {
      // El contenedor vive dentro de un ng-template del modal; lo buscamos por id
      const container = await this.esperarContenedor();

      // Carga diferida: el SDK pesa varios MB y solo se descarga al abrir el editor.
      // React y styled-components son dependencias obligatorias de photoeditorsdk.
      const [pesdk, react, reactDom] = await Promise.all([import('photoeditorsdk'), import('react'), import('react-dom')]);

      if (token !== this.editorToken || !this.isEditorOpen) {
        return; // el usuario cerró el modal mientras cargaba
      }

      const w = window as any;
      w.React = w.React || (react as any).default || react;
      w.ReactDom = w.ReactDom || (reactDom as any).default || reactDom;

      const { PhotoEditorSDKUI, UIEvent, ImageFormat, ExportFormat } = pesdk as any;

      const editor = await PhotoEditorSDKUI.init({
        container,
        image: this.imagenParaEditor,
        license: '', // sin licencia funciona en modo prueba (con marca de agua)
        theme: 'dark',
        // Los recursos (fuentes, filtros, íconos) se copian en angular.json -> assets
        assetBaseUrl: '/assets/photoeditorsdk',
        export: {
          image: {
            enableDownload: false, // no descargar: devolvemos la imagen a la app
            format: ImageFormat.JPEG,
            quality: 0.8,
            exportType: ExportFormat.DATA_URL,
          },
        },
      });

      if (token !== this.editorToken || !this.isEditorOpen) {
        editor.dispose();
        return;
      }
      this.editorInstance = editor;

      // Se dispara cuando el usuario pulsa "Exportar"/"Guardar" en el editor
      editor.on(UIEvent.EXPORT, (imagen: string) => {
        this.perfil.foto_url = imagen;
        this.presentToast('Foto lista. Pulsa "Guardar cambios" para subirla.');
        setTimeout(() => this.cerrarPhotoEditor());
      });
    } catch (error) {
      console.error('Error al inicializar PhotoEditor SDK', error);
      this.presentToast('No se pudo abrir el editor de fotos');
      this.cerrarPhotoEditor();
    }
  }

  private async esperarContenedor(): Promise<HTMLElement> {
    for (let i = 0; i < 20; i++) {
      const el = document.getElementById(EDITOR_CONTAINER_ID);
      if (el) {
        return el;
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    throw new Error('El contenedor del editor no está disponible');
  }

  cerrarPhotoEditor() {
    this.editorToken++;
    const editor = this.editorInstance;
    this.editorInstance = null;
    try {
      editor?.dispose(); // libera memoria y listeners del SDK
    } catch (error) {
      console.warn('Error al liberar el editor', error);
    }
    this.isEditorOpen = false;
    this.cdr.markForCheck();
  }

  // --- GUARDAR PERFIL ---
  async guardar() {
    if (this.guardando) {
      return;
    }
    const email = this.perfil.email.trim();
    if (email && !EMAIL_RE.test(email)) {
      this.presentToast('El correo no es válido');
      return;
    }
    if (!this.perfil.username.trim()) {
      this.presentToast('El nombre de usuario es obligatorio');
      return;
    }

    this.guardando = true;
    try {
      await this.perfilService.actualizarPerfil({
        ...this.perfil,
        email,
        username: this.perfil.username.trim(),
        nombre: this.perfil.nombre.trim(),
      });
      this.presentToast('Perfil actualizado correctamente');
      await this.cargarPerfil();
    } catch (error: any) {
      this.presentToast(error.response?.data?.message || 'Error al guardar');
    } finally {
      this.guardando = false;
      this.cdr.markForCheck();
    }
  }

  // --- BLUETOOTH ---
  async conectarLector() {
    const listo = await this.bluetoothService.inicializarBluetooth();
    if (!listo) {
      this.presentToast('El Bluetooth no está disponible o no diste permiso');
      return;
    }

    let device;
    try {
      device = await this.bluetoothService.solicitarDispositivo();
    } catch (error) {
      this.presentToast('No se seleccionó ningún dispositivo');
      return;
    }

    try {
      await this.bluetoothService.conectar(device, () => {
        // El lector se apagó o se alejó
        this.dispositivoConectado = null;
        this.cdr.markForCheck();
        this.presentToast('Lector desconectado');
      });
      this.dispositivoConectado = device.name || device.deviceId;
      await Preferences.set({ key: 'ultimo_lector', value: device.deviceId });
      this.cdr.markForCheck();
      this.presentToast(`Conectado a ${this.dispositivoConectado}`);
    } catch (error) {
      console.error('No se pudo conectar al lector', error);
      this.presentToast('No se pudo conectar con el lector. Acércalo e intenta de nuevo.');
    }
  }

  async desconectarLector() {
    try {
      await this.bluetoothService.desconectar();
    } catch (error) {
      console.warn('Error al desconectar', error);
    }
    this.dispositivoConectado = null;
    this.cdr.markForCheck();
    this.presentToast('Lector desconectado');
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({ message, duration: 2000, position: 'bottom' });
    await toast.present();
  }
}
