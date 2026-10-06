import { Injectable } from '@angular/core';
import { Network } from '@capacitor/network';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  // Variables para saber el estado de la conexión
  private isOnline = new BehaviorSubject<boolean>(true);
  public isOnline$ = this.isOnline.asObservable();

  constructor() {
    this.init();
  }

  private async init() {
    // Revisar el estado actual al arrancar
    const status = await Network.getStatus();
    this.isOnline.next(status.connected);

    // Escuchar cambios en la red en tiempo real
    Network.addListener('networkStatusChange', status => {
      this.isOnline.next(status.connected);
    });
  }

  // Método rápido para preguntar si hay internet
  getCurrentStatus(): boolean {
    return this.isOnline.value;
  }
}