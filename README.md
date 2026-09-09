# 📱 Sistema de Login y CRUD de Usuarios

Aplicación móvil/híbrida desarrollada con **Ionic Angular** que implementa un sistema de autenticación de usuarios y un CRUD completo.

El backend está desarrollado en **PHP puro utilizando PDO**, con **MySQL** como base de datos mediante **XAMPP**. El sistema utiliza hashing de contraseñas y tokens de autenticación mediante **Bearer Token** para proteger los endpoints del CRUD.

---

## 🛠️ Tech Stack

### Frontend

* **Ionic** — Componentes para aplicaciones móviles y web
* **Angular** — Framework frontend, routing y route guards
* **Axios** — Cliente HTTP para consumir la API
* **Ionicons** — Biblioteca de iconos

### Backend

* **PHP** — API REST sin frameworks
* **PDO** — Conexión segura entre PHP y MySQL
* **MySQL** — Base de datos relacional
* **XAMPP** — Entorno local para Apache y MySQL
* **phpMyAdmin** — Administración de la base de datos

---

## ✨ Características

### 🔐 Autenticación

* Login mediante correo electrónico y contraseña.
* Validación de credenciales mediante la API.
* Contraseñas almacenadas utilizando `password_hash()` de PHP.
* Verificación mediante `password_verify()`.
* Generación de tokens de autenticación.
* Uso de `Bearer Token` para proteger los endpoints.

### 🛡️ Protección de rutas

* Implementación de un **Route Guard** en Angular.
* Las rutas protegidas requieren una sesión válida.
* Los usuarios no autenticados son redirigidos automáticamente al Login.
* El token de sesión se almacena en `localStorage`.

### 👥 CRUD de usuarios

El sistema permite:

* Consultar usuarios.
* Crear nuevos usuarios.
* Editar usuarios existentes.
* Eliminar usuarios.
* Visualizar los registros mediante una tabla.
* Crear y editar usuarios mediante un modal.

### 🌐 Comunicación con la API

Axios se utiliza para realizar las peticiones HTTP entre Ionic y PHP.

Las peticiones protegidas incluyen automáticamente el token en el header:

```http
Authorization: Bearer <token>
```

Los endpoints del CRUD utilizan los métodos:

* `GET`
* `POST`
* `PATCH`
* `DELETE`

---

## 📋 Requisitos previos

Antes de ejecutar el proyecto, asegúrate de tener instalado:

* [Node.js](https://nodejs.org/) — Se recomienda la versión LTS.
* [Ionic CLI](https://ionicframework.com/docs/cli)
* [XAMPP](https://www.apachefriends.org/) — Para Apache y MySQL.
* Un navegador web moderno.

Para instalar Ionic CLI:

```bash
npm install -g @ionic/cli
```

---

# 🚀 Instalación

## 1. Configurar el Backend

### Paso 1 — Iniciar XAMPP

Abre XAMPP e inicia los módulos:

* **Apache**
* **MySQL**

### Paso 2 — Crear la carpeta de la API

Dentro de la instalación de XAMPP, crea la siguiente carpeta:

```text
C:\xampp\htdocs\api
```

Coloca dentro de esta carpeta los archivos PHP del backend:

```text
api/
├── login.php
└── usuarios_api.php
```

### Paso 3 — Crear la base de datos

Abre phpMyAdmin:

```text
http://localhost/phpmyadmin
```

Crea una base de datos llamada:

```text
login_db
```

Después, ejecuta el siguiente script SQL:

```sql
CREATE TABLE `users` (
    `id` int(11) NOT NULL,
    `email` varchar(100) NOT NULL,
    `password` varchar(255) NOT NULL,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `token` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `users`
    ADD PRIMARY KEY (`id`),
    ADD UNIQUE KEY `email` (`email`);

ALTER TABLE `users`
    MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,
    AUTO_INCREMENT=1;

INSERT INTO `users`
    (`id`, `email`, `password`, `created_at`)
VALUES
    (
        1,
        'admin@test.com',
        '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        '2026-09-01 00:00:00'
    );
```

---

# 2. Configurar el Frontend

### Paso 1 — Clonar el repositorio

Clona el proyecto:

```bash
git clone <repository-url>
```

Entra a la carpeta del proyecto:

```bash
cd <project-folder>
```

### Paso 2 — Instalar dependencias

Ejecuta:

```bash
npm install
```

Después instala Axios:

```bash
npm install axios
```

### Paso 3 — Configurar la URL de la API

Verifica los archivos:

```text
src/app/login/
src/app/tab1/
```

y asegúrate de que las peticiones apunten al backend local:

```text
http://127.0.0.1/api/
```

Por ejemplo:

```typescript
http://127.0.0.1/api/login.php
```

Se recomienda utilizar `127.0.0.1` en lugar de `localhost` para evitar posibles problemas relacionados con IPv6 o la configuración local del servidor.

### Paso 4 — Ejecutar Ionic

Inicia el servidor de desarrollo:

```bash
ionic serve
```

La aplicación estará disponible en la dirección que indique Ionic, normalmente:

```text
http://localhost:8100
```

---

# 🔑 Credenciales de prueba

Utiliza las siguientes credenciales para probar el sistema:

| Campo      | Valor            |
| ---------- | ---------------- |
| Correo     | `admin@test.com` |
| Contraseña | `123456`         |

---

# 📂 Estructura del proyecto

```text
project/
│
├── src/
│   └── app/
│       ├── login/
│       │   ├── login.page.html
│       │   ├── login.page.scss
│       │   └── login.page.ts
│       │
│       ├── tabs/
│       │   └── ...
│       │
│       ├── tab1/
│       │   └── ...
│       │
│       ├── tab2/
│       │   └── ...
│       │
│       ├── tab3/
│       │   └── ...
│       │
│       ├── auth.guard.ts
│       └── main.ts
│
├── package.json
├── angular.json
└── ...
```

Backend:

```text
C:\xampp\htdocs\
│
└── api/
    ├── login.php
    └── usuarios_api.php
```

---

# 🔒 Seguridad

El proyecto implementa diferentes mecanismos para proteger las cuentas y los endpoints de la API.

### 1. Hashing de contraseñas

Las contraseñas no se almacenan directamente en texto plano.

PHP utiliza:

```php
password_hash()
```

para generar el hash y:

```php
password_verify()
```

para comprobar las credenciales durante el login.

---

### 2. Tokens de autenticación

Después de iniciar sesión correctamente, el backend genera un token aleatorio utilizando:

```php
bin2hex(random_bytes(32))
```

El token se almacena en la base de datos y se utiliza para autenticar las peticiones posteriores.

---

### 3. Bearer Token

Los endpoints protegidos requieren el siguiente header:

```http
Authorization: Bearer <token>
```

Si el token no existe o no es válido, la API rechaza la petición.

---

### 4. Route Guard

Angular utiliza un `auth.guard.ts` para evitar que usuarios no autenticados accedan a las rutas protegidas.

El flujo básico es:

```text
Login
  │
  ├── Credenciales incorrectas ──> Error
  │
  └── Credenciales correctas
            │
            ▼
        Generar token
            │
            ▼
       Guardar sesión
            │
            ▼
      Acceso a /tabs
```

---

# 🔄 Flujo de autenticación

```text
┌──────────────┐
│    Usuario   │
└──────┬───────┘
       │
       │ Email + Password
       ▼
┌──────────────┐
│ Ionic Angular│
└──────┬───────┘
       │
       │ POST
       ▼
┌──────────────┐
│   PHP API    │
│  login.php   │
└──────┬───────┘
       │
       │ password_verify()
       ▼
┌──────────────┐
│    MySQL     │
└──────┬───────┘
       │
       │ Token
       ▼
┌──────────────┐
│ Ionic Angular│
└──────┬───────┘
       │
       │ Bearer Token
       ▼
┌──────────────┐
│ usuarios_api │
│     .php     │
└──────────────┘
```

---

# 📡 API

La API cuenta principalmente con dos archivos:

### `login.php`

Responsable de:

* Recibir las credenciales.
* Buscar al usuario en MySQL.
* Verificar la contraseña.
* Generar el token.
* Devolver la información de autenticación.

### `usuarios_api.php`

Responsable de:

* Validar el token.
* Consultar usuarios.
* Crear usuarios.
* Actualizar usuarios.
* Eliminar usuarios.

---

# 🧪 Pruebas

Para probar el proyecto:

1. Inicia **Apache** y **MySQL** en XAMPP.
2. Verifica que la base de datos `login_db` exista.
3. Ejecuta el proyecto Ionic:

```bash
ionic serve
```

4. Ingresa con:

```text
Email: admin@test.com
Password: 123456
```

5. Después del login, accede a la sección de usuarios.

6. Prueba las operaciones de:

   * Crear
   * Consultar
   * Editar
   * Eliminar

7. Finalmente, utiliza **Logout** y verifica que las rutas protegidas vuelvan a solicitar autenticación.

---

# 📌 Notas

Este proyecto está configurado para ejecutarse en un entorno local utilizando **XAMPP** como servidor para la API PHP y **MySQL** como sistema gestor de base de datos.

Para un entorno de producción se recomienda utilizar:

* HTTPS.
* Variables de entorno para las credenciales de la base de datos.
* Expiración de tokens.
* Revocación de tokens.
* Configuración adecuada de CORS.
* Validación y sanitización adicional de los datos recibidos.
* Un sistema de gestión de sesiones o tokens más robusto.
