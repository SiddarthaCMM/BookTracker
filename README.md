Sistema de Login y CRUD de Usuarios (Ionic + PHP)
Aplicación móvil/híbrida desarrollada con Ionic Angular que implementa un sistema de autenticación de usuarios y un CRUD completo. El backend está construido con PHP puro (PDO) y MySQL (corriendo sobre XAMPP), implementando seguridad mediante hashes y Tokens de autenticación (Bearer Token).

🛠️ Tech Stack (Tecnologías Utilizadas)
Frontend (App Móvil/Web):

Ionic (Componentes Standalone)
Angular (Enrutamiento moderno y Guards)
Axios (Cliente HTTP para peticiones a la API)
Ionicons (Íconos)
Backend (API):

PHP puro (Sin frameworks)
PDO (PHP Data Objects) para conexión segura a MySQL
MySQL (Base de datos relacional administrada con XAMPP/phpMyAdmin)
✨ Características Principales
Pantalla de Login: Autenticación de usuarios con validación de credenciales en el backend.
Route Guards (Safeguard): Protección de rutas en Angular. Si un usuario intenta acceder a los Tabs sin iniciar sesión, es redirigido automáticamente al Login.
CRUD Completo: Vista de administración con una tabla moderna para visualizar usuarios y un Modal para Crear/Editar registros.
Seguridad de Contraseñas: Las contraseñas se guardan en la base de datos utilizando password_hash de PHP (BCRYPT).
Protección de API por Tokens: Implementación de un middleware en PHP que exige un Token válido para poder consumir los endpoints del CRUD. Evita que alguien use la API sin haber iniciado sesión.
Interceptores con Axios: Todas las peticiones HTTP envían automáticamente el Token de autenticación en los headers.
📋 Requisitos Previos
Antes de clonar y ejecutar este proyecto, asegúrate de tener instalado:

Node.js (LTS recomendado)
Ionic CLI (npm install -g @ionic/cli)
XAMPP (Para correr Apache y MySQL localmente)
🚀 Instalación y Puesta en Marcha
Sigue estos pasos para levantar tanto el backend como el frontend en tu máquina local.

1. Configuración del Backend (PHP + MySQL)
Inicia los módulos de Apache y MySQL desde el panel de control de XAMPP.
Crea una carpeta llamada api dentro de C:\xampp\htdocs\ (o la ruta donde tengas instalado XAMPP).
Guarda dentro de esa carpeta los siguientes archivos PHP:
login.php (Maneja la autenticación y genera el token)
usuarios_api.php (Contiene la lógica del CRUD y el middleware de validación)
Abre tu navegador y entra a http://localhost/phpmyadmin.
Crea una nueva base de datos llamada login_db.
Ve a la pestaña SQL y ejecuta la siguiente consulta para crear la tabla e insertar un usuario de prueba:
CREATE TABLE `users` (  `id` int(11) NOT NULL,  `email` varchar(100) NOT NULL,  `password` varchar(255) NOT NULL,  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),  `token` varchar(255) DEFAULT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;ALTER TABLE `users`  ADD PRIMARY KEY (`id`),  ADD UNIQUE KEY `email` (`email`);ALTER TABLE `users`  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;-- Usuario de prueba (Email: admin@test.com | Contraseña: 123456)INSERT INTO `users` (`id`, `email`, `password`, `created_at`) VALUES(1, 'admin@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2026-09-01 00:00:00');
2. Configuración del Frontend (Ionic)
Clona este repositorio en tu máquina local.
Abre una terminal en la raíz del proyecto e instala las dependencias de Node:
bash

npm install
Instala Axios (necesario para las peticiones HTTP):
bash

npm install axios
Verifica que en los archivos TypeScript (tab1.page.ts y login.page.ts), la URL de la API apunte a http://127.0.0.1/api/... (evita usar localhost para prevenir bloqueos de CORS o problemas con IPv6).
Levanta el servidor de desarrollo de Ionic:
bash

ionic serve
🔑 Credenciales de Prueba
Para probar el sistema de login, utiliza las siguientes credenciales:

Correo: admin@test.com
Contraseña: 123456
📂 Estructura del Proyecto
text

├── src/
│   ├── app/
│   │   ├── login/              # Vista y lógica del Login
│   │   ├── tabs/               # Contenedor de pestañas (Incluye botón de Logout)
│   │   ├── tab1/               # Vista principal: CRUD de Usuarios (Tabla y Modal)
│   │   ├── tab2/               # Vista secundaria vacía
│   │   ├── tab3/               # Vista secundaria vacía
│   │   ├── auth.guard.ts       # Guardia de ruta para proteger /tabs/*
│   │   └── main.ts             # Configuración de provideHttpClient y enrutamiento
├── htdocs/api/ (XAMPP)
│   ├── login.php               # Endpoint de autenticación
│   ├── usuarios_api.php        # CRUD de usuarios con middleware de token
🔒 Seguridad Implementada
Hashing de Contraseñas: Uso de password_hash y password_verify en PHP. Las contraseñas originales son irreversibles.
Tokens de Sesión: Al iniciar sesión, el backend genera un token aleatorio (bin2hex(random_bytes(32))) y lo guarda en la BD. Se elimina el acceso directo a los datos del CRUD sin este token.
Route Guards: Angular evita la navegación a rutas protegidas si el estado de sesión no está guardado en el localStorage del navegador.
Headers de Autorización: Axios envía el token en la cabecera Authorization: Bearer <token> en cada petición GET, POST, PATCH o DELETE al CRUD.