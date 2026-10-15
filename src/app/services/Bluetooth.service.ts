import { Injectable } from '@angular/core';
import { BluetoothLe } from '@capacitor-community/bluetooth-le';

@Injectable({
  providedIn: 'root'
})
export class BluetoothService {
  
  constructor() { }

  async inicializarBluetooth() {
    try {
      // Inicializa el plugin
      await BluetoothLe.initialize();
      return true;
    } catch (error) {
      console.error('Error al inicializar Bluetooth', error);
      return false;
    }
  }

  async solicitarDispositivo(): Promise<any> {
    try {
      // Esto abre el selector nativo de Bluetooth del teléfono para elegir un dispositivo
      const result = await BluetoothLe.requestDevice();
      return result;
    } catch (error) {
      console.error('Error al solicitar dispositivo', error);
      throw error;
    }
  }
}