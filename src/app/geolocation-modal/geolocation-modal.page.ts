import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonIcon, IonSpinner, ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  locationOutline, cameraOutline, videocamOutline, closeOutline,
  navigateOutline, refreshOutline,
} from 'ionicons/icons';
import { Geolocation } from '@capacitor/geolocation';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

interface Coordenada {
  lat: number;
  lng: number;
}

@Component({
  selector: 'app-geolocation-modal',
  templateUrl: './geolocation-modal.page.html',
  styleUrls: ['./geolocation-modal.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
    IonIcon, IonSpinner,
  ],
})
export class GeolocationModalPage {
  // --- Estado de geolocalización ---
  cargando = false;
  permisoDenegado = false;
  errorMensaje: string | null = null;

  lat: number | null = null;
  lng: number | null = null;
  precision: number | null = null;
  timestamp: Date | null = null;

  // --- Funcionalidad basada en ubicación ---
  // "Sedes" simuladas de Mi Lector en México para calcular distancia.
  sedes: { nombre: string; direccion: string; coord: Coordenada }[] = [
    { nombre: 'Mi Lector CDMX', direccion: 'Centro Histórico, CDMX', coord: { lat: 19.4326, lng: -99.1332 } },
    { nombre: 'Mi Lector Guadalajara', direccion: 'Centro, Guadalajara', coord: { lat: 20.6597, lng: -103.3496 } },
    { nombre: 'Mi Lector Monterrey', direccion: 'Macroplaza, Monterrey', coord: { lat: 25.6866, lng: -100.3161 } },
    { nombre: 'Mi Lector Puebla', direccion: 'Zócalo, Puebla', coord: { lat: 19.0434, lng: -98.1980 } },
  ];
  sedeMasCercana: { nombre: string; direccion: string; distanciaKm: number } | null = null;

  // --- Cámara / video ---
  cargandoCamara = false;
  imagenCapturada: string | null = null;
  videoCapturado: string | null = null;

  // Handler que pasa el padre para cerrar el modal.
  @Input() cerrarHandler!: () => void;

  constructor(
    private toastController: ToastController,
    private cdr: ChangeDetectorRef,
  ) {
    addIcons({
      'location-outline': locationOutline,
      'camera-outline': cameraOutline,
      'videocam-outline': videocamOutline,
      'close-outline': closeOutline,
      'navigate-outline': navigateOutline,
      'refresh-outline': refreshOutline,
    });
  }

  // ---------------------------------------------------------------
  // 1) SOLICITAR PERMISO + OBTENER COORDENADAS
  // ---------------------------------------------------------------
  async obtenerUbicacion(): Promise<void> {
    this.cargando = true;
    this.permisoDenegado = false;
    this.errorMensaje = null;
    this.cdr.markForCheck();

    try {
      let lat: number;
      let lng: number;
      let accuracy: number;
      let timestamp: number;

      // Detectar plataforma: si es web, usar navigator.geolocation (HTML5).
      // Si es nativo (Android/iOS), usar @capacitor/geolocation.
      const esWeb = !(window as any)?.Capacitor?.isNativePlatform?.();

      if (esWeb) {
        // ===== WEB: API nativa de HTML5 =====
        if (!navigator.geolocation) {
          throw new Error('Tu navegador no soporta geolocalización');
        }

        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          });
        });

        lat = position.coords.latitude;
        lng = position.coords.longitude;
        accuracy = position.coords.accuracy;
        timestamp = position.timestamp;
      } else {
        // ===== NATIVO (Android/iOS): @capacitor/geolocation =====
        const permisoStatus = await Geolocation.checkPermissions();
        let permiso = permisoStatus.location;

        if (permiso !== 'granted') {
          const req = await Geolocation.requestPermissions({ permissions: ['location'] });
          permiso = req.location;
        }

        if (permiso !== 'granted') {
          this.permisoDenegado = true;
          this.errorMensaje = 'Permiso de ubicación denegado. Habilítalo en los ajustes del dispositivo.';
          await this.presentToast('Permiso de ubicación denegado');
          return;
        }

        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });

        lat = position.coords.latitude;
        lng = position.coords.longitude;
        accuracy = position.coords.accuracy;
        timestamp = position.timestamp;
      }

      this.lat = lat;
      this.lng = lng;
      this.precision = accuracy;
      this.timestamp = new Date(timestamp);

      this.calcularSedeMasCercana();

      await this.presentToast('Ubicación obtenida correctamente');
    } catch (err: any) {
      console.error('Error geolocation', err);
      this.manejarErrorGeolocation(err);
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  // ---------------------------------------------------------------
  // Manejo de errores
  // ---------------------------------------------------------------
  private manejarErrorGeolocation(err: any): void {
    // GeolocationPositionError de HTML5 usa códigos numéricos
    if (typeof err?.code === 'number') {
      switch (err.code) {
        case 1: // PERMISSION_DENIED
          this.permisoDenegado = true;
          this.errorMensaje = 'Permiso de ubicación rechazado. Habilítalo en los ajustes del navegador para usar esta función.';
          break;
        case 2: // POSITION_UNAVAILABLE
          this.errorMensaje = 'Ubicación no disponible. Activa el GPS del dispositivo o revisa tu conexión.';
          break;
        case 3: // TIMEOUT
          this.errorMensaje = 'El dispositivo tardó demasiado en obtener la ubicación. Revisa tu señal GPS.';
          break;
        default:
          this.errorMensaje = 'No se pudo obtener la ubicación.';
      }
      return;
    }

    // Errores de Capacitor u otros
    const msg = String(err?.message ?? err).toLowerCase();
    if (msg.includes('permission denied') || msg.includes('denied')) {
      this.permisoDenegado = true;
      this.errorMensaje = 'Permiso de ubicación rechazado. Habilítalo para usar esta función.';
    } else if (msg.includes('timeout') || msg.includes('timed out')) {
      this.errorMensaje = 'El dispositivo tardó demasiado en obtener la ubicación. Revisa tu señal GPS.';
    } else if (msg.includes('unavailable') || msg.includes('position unavailable')) {
      this.errorMensaje = 'Ubicación no disponible. Activa el GPS del dispositivo.';
    } else {
      this.errorMensaje = 'No se pudo obtener la ubicación: ' + (err?.message ?? 'error desconocido');
    }
  }

  // ---------------------------------------------------------------
  // 3+4) Funcionalidad basada en ubicación: sede más cercana
  // ---------------------------------------------------------------
  private calcularSedeMasCercana(): void {
    if (this.lat === null || this.lng === null) return;

    let masCercana = this.sedes[0];
    let distanciaMin = this.distanciaHaversine(
      { lat: this.lat, lng: this.lng },
      masCercana.coord,
    );

    for (let i = 1; i < this.sedes.length; i++) {
      const d = this.distanciaHaversine(
        { lat: this.lat, lng: this.lng },
        this.sedes[i].coord,
      );
      if (d < distanciaMin) {
        distanciaMin = d;
        masCercana = this.sedes[i];
      }
    }

    this.sedeMasCercana = {
      nombre: masCercana.nombre,
      direccion: masCercana.direccion,
      distanciaKm: Math.round(distanciaMin * 10) / 10,
    };
  }

  /** Fórmula de Haversine — distancia en km entre dos puntos GPS. */
  private distanciaHaversine(p1: Coordenada, p2: Coordenada): number {
    const R = 6371; // radio de la Tierra en km
    const dLat = this.toRad(p2.lat - p1.lat);
    const dLng = this.toRad(p2.lng - p1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(p1.lat)) * Math.cos(this.toRad(p2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }

  // ---------------------------------------------------------------
  // 6) Captura de foto o video desde el dispositivo
  // ---------------------------------------------------------------
  async tomarFoto(): Promise<void> {
    if (this.cargandoCamara) return;
    this.cargandoCamara = true;
    this.cdr.markForCheck();

    try {
      const photo = await Camera.getPhoto({
        quality: 80,
        width: 1280,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt, // pregunta al usuario: cámara o galería
        correctOrientation: true,
      });

      if (photo.dataUrl) {
        this.imagenCapturada = photo.dataUrl;
        this.videoCapturado = null; // solo uno a la vez
        await this.presentToast('Foto capturada');
      }
    } catch (err: any) {
      const msg = String(err?.message ?? err).toLowerCase();
      if (!msg.includes('cancel')) {
        console.error('Error cámara', err);
        await this.presentToast('No se pudo tomar la foto. Revisa los permisos.');
      }
    } finally {
      this.cargandoCamara = false;
      this.cdr.markForCheck();
    }
  }

  async grabarVideo(): Promise<void> {
    if (this.cargandoCamara) return;
    this.cargandoCamara = true;
    this.cdr.markForCheck();

    try {
      // En web esto abre el selector de cámara/galería del navegador
      const video = await (Camera as any).pickVideos({
        quality: 80,
        limit: 1,
      });

      if (video?.videos?.length) {
        this.videoCapturado = video.videos[0].dataUrl || video.videos[0].webPath;
        this.imagenCapturada = null;
        await this.presentToast('Video capturado');
      }
    } catch (err: any) {
      const msg = String(err?.message ?? err).toLowerCase();
      if (!msg.includes('cancel')) {
        console.error('Error video', err);
        await this.presentToast('No se pudo grabar el video. Revisa los permisos.');
      }
    } finally {
      this.cargandoCamara = false;
      this.cdr.markForCheck();
    }
  }

  // ---------------------------------------------------------------
  // Utilidades
  // ---------------------------------------------------------------
  get mapsLink(): string {
    if (this.lat === null || this.lng === null) return '#';
    return `https://www.google.com/maps?q=${this.lat},${this.lng}`;
  }

  limpiarCaptura(): void {
    this.imagenCapturada = null;
    this.videoCapturado = null;
    this.cdr.markForCheck();
  }

  cerrar(): void {
    this.cerrarHandler?.();
  }

  private async presentToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message, duration: 2200, position: 'bottom',
    });
    await toast.present();
  }
}