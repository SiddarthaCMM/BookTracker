import { Injectable } from '@angular/core';
import { BleClient, BleDevice } from '@capacitor-community/bluetooth-le';

@Injectable({
  providedIn: 'root',
})
export class BluetoothService {
  private inicializado = false;
  private dispositivo: BleDevice | null = null;

  get dispositivoActual(): BleDevice | null {
    return this.dispositivo;
  }

  async inicializarBluetooth(): Promise<boolean> {
    if (this.inicializado) {
      return true;
    }
    try {
      // androidNeverForLocation: no pedimos permiso de ubicación para escanear (Android 12+)
      await BleClient.initialize({ androidNeverForLocation: true });
      this.inicializado = true;
      return true;
    } catch (error) {
      console.error('Error al inicializar Bluetooth', error);
      return false;
    }
  }

  /** Abre el selector nativo de dispositivos Bluetooth. Lanza error si el usuario cancela. */
  async solicitarDispositivo(): Promise<BleDevice> {
    return BleClient.requestDevice();
  }

  /** Se conecta al dispositivo elegido. onDesconexion avisa si el lector se apaga o se aleja. */
  async conectar(device: BleDevice, onDesconexion?: (deviceId: string) => void): Promise<void> {
    await BleClient.connect(
      device.deviceId,
      (deviceId) => {
        this.dispositivo = null;
        onDesconexion?.(deviceId);
      },
      { timeout: 10000 }
    );
    this.dispositivo = device;
  }

  async desconectar(): Promise<void> {
    if (!this.dispositivo) {
      return;
    }
    try {
      await BleClient.disconnect(this.dispositivo.deviceId);
    } finally {
      this.dispositivo = null;
    }
  }
}
