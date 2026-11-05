import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.demo.pg.cap.ng',
  appName: 'Mi Lector',
  npmClient: 'npm',
  webDir: 'www',
  server: {
    androidScheme: 'https',
    // Permite llamar a la API PHP local por http:// (XAMPP). En producción usa HTTPS y quita esto.
    cleartext: true,
  },
  plugins: {
    // Las peticiones (axios/fetch) salen por el código nativo: evita CORS y el bloqueo
    // de "contenido mixto" (app https://localhost -> API http://IP/api).
    CapacitorHttp: { enabled: true },
  },
};

export default config;
