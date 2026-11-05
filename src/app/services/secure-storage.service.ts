import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';

/**
 * SecureStorageService — RF-AUT-05
 * --------------------------------------------------------------
 * Abstrae dónde guardar el token:
 *
 *  - En nativo (Android/iOS): usa capacitor-secure-storage-plugin
 *    → Keystore (Android) / Keychain (iOS).
 *  - En web: la memoria del proceso (se pierde al recargar). El
 *    requerimiento RF-AUT-05 acepta esto.
 *
 * El rol y el userId siguen en Preferences (no son secretos).
 */
@Injectable({ providedIn: 'root' })
export class SecureStorageService {
  private memoryToken: string | null = null;

  async set(key: string, value: string): Promise<boolean> {
    try {
      if (this.isWeb()) {
        this.memoryToken = value;
        return true;
      }
      await SecureStoragePlugin.set({ key, value });
      return true;
    } catch (e) {
      console.warn('SecureStorage falló, usando memoria como fallback', e);
      this.memoryToken = value;
      return false;
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.isWeb()) {
      return this.memoryToken;
    }
    try {
      const { value } = await SecureStoragePlugin.get({ key });
      return value;
    } catch (e) {
      return null;
    }
  }

  async remove(key: string): Promise<boolean> {
    if (this.isWeb()) {
      this.memoryToken = null;
      return true;
    }
    try {
      await SecureStoragePlugin.remove({ key });
      return true;
    } catch (e) {
      this.memoryToken = null;
      return false;
    }
  }

  private isWeb(): boolean {
    const w = window as any;
    if (w?.Capacitor?.getPlatform) {
      return w.Capacitor.getPlatform() === 'web';
    }
    return true;
  }
}