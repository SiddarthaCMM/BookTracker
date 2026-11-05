# 📚 Mi Lector

App híbrida (Ionic + Angular + Capacitor) para gestionar una biblioteca personal.
Backend en **PHP + PDO + MySQL** (XAMPP).

## Funciones

- **Login** con roles: `admin` y `user`. Las rutas están protegidas con guards (exigen token y rol).
- **Admin**: CRUD de usuarios, CRUD de libros y dashboard con gráficas (D3).
- **Usuario**: buscar libros (base local y Open Library), ver su biblioteca y editar su perfil.
- **Perfil**: foto con la cámara/galería, edición con PhotoEditor SDK y conexión a un lector por Bluetooth LE.
- **Modo offline**: usuarios y libros se guardan en caché local y se muestran sin conexión (solo lectura).

## Requisitos

Node.js (versión indicada en `package.json`), Ionic CLI (`npm i -g @ionic/cli`), XAMPP y Android Studio (para Android).

## Backend

1. Inicia **Apache** y **MySQL** en XAMPP.
2. Copia los archivos PHP a `C:\xampp\htdocs\api\`:
   `login.php`, `usuarios_api.php`, `libros_api.php`, `dashboard_api.php`, `perfil_api.php`.
3. Crea la base de datos `login_db` en phpMyAdmin e importa el script SQL del proyecto.
4. Si pruebas en el navegador (`ionic serve`), los PHP deben responder con cabeceras CORS:

```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, X-Auth-Token');
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
```

> En la app instalada en el teléfono no hace falta CORS: las peticiones salen por el código nativo
> (`CapacitorHttp` en `capacitor.config.ts`).

## Frontend

```bash
npm install
npm start                # navegador
```

### Android

```bash
npm run sync:android     # detecta tu IP, compila y sincroniza los plugins nativos
npx cap open android     # abre Android Studio y ejecuta en el teléfono
```

El teléfono y la PC deben estar en la **misma red Wi-Fi**. Si la IP cambia, no hace falta recompilar:
en el login pulsa el engranaje ⚙️ y escribe la nueva IP del servidor.

Si el firewall de Windows bloquea el acceso, permite Apache (puerto 80) en redes privadas.

## Estructura

```
src/app/
├── api-config.ts          URL base de la API (IP configurable)
├── app.component.ts       interceptores de axios (token + cierre de sesión en 401)
├── *.guard.ts             admin / user / guest
├── login/                 login + configuración de IP
├── tabs/ tab1/ tab2/ tab3/   panel de administrador (usuarios, libros, dashboard)
├── user-tabs/ user-inicio/ user-biblioteca/ user-perfil/   panel de usuario
└── services/Bluetooth.service.ts
```

## Notas

- La app es **zoneless** (sin zone.js): después de un `await`, si cambias una propiedad que se muestra
  en pantalla, llama a `cdr.markForCheck()` (o usa signals).
- PhotoEditor SDK funciona sin licencia en modo prueba (con marca de agua). Para quitarla, añade tu
  licencia de img.ly en `user-perfil.page.ts`.
- Seguridad: `usesCleartextTraffic` (Android) y `NSAllowsArbitraryLoads` (iOS) permiten `http://` solo
  para desarrollo local. En producción usa HTTPS y elimínalos.
