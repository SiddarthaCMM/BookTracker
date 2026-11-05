DECISIONES.md — RF-AUT-01
1. Alcance de esta fase
Se implementó únicamente RF-AUT-01 (P1) — Registro de cuenta. Los demásrequerimientos del módulo de Autenticación (RF-AUT-02 a RF-AUT-08) se abordaránen fases siguientes, no en esta.

2. Decisiones de diseño
D-AUT-01.1 — Servicio de autenticación separado
Se creó un nuevo AuthService en src/app/services/auth.service.ts en lugarde extender el LoginService existente. Razón: la sección 3 del documento yRF-AUT-05 apuntan a un modelo con auth_tokens, password_resets,almacenamiento seguro, etc. Mantener LoginService intacto evita romper lasimportaciones ya usadas en app.component.ts, tabs.page.ts, tab1.page.tsy los tres guards (admin/user/guest). En una fase posterior se unificará todoen AuthService.

D-AUT-01.2 — Token en users.token (no auth_tokens todavía)
La migración añade la columna users.token solo si no existe (compatibilidadcon el PHP actual). La tabla auth_tokens (token hasheado + caducidad) quedapara RF-AUT-05.

D-AUT-01.3 — Rate-limit con login_attempts compartida
Se creó una sola tabla login_attempts con event_type('login_failed' | 'register') que servirá tanto para RF-AUT-01(5 cuentas/hora por IP) como para RF-AUT-02 (5 intentos fallidos/15 min porcorreo+IP). Esto evita dos tablas casi idénticas.

D-AUT-01.4 — Username case-insensitive vía columna generada
MySQL/MariaDB no permite forzar unicidad case-insensitive de forma directasalvo que el collation de la columna sea _ci. Para no depender del collation,se añade una columna virtual generada username_lc = LOWER(username) coníndice UNIQUE. Garantiza que Ana21 y ana21 colisionen.

D-AUT-01.5 — display_name por defecto = username
Al crear el usuario, display_name se rellena con el username. Es editablemás tarde desde el perfil (RF-PER-02, fase futura).

D-AUT-01.6 — language por defecto 'es' (no 'preferred_language')
El documento de requerimientos (sección 3) usa language. El PHP actual deperfil_api.php usa preferred_language. La migración crea language (lacolumna del documento); cuando se implemente RF-PER-02 se ajustaráperfil_api.php para leer/escribir language en lugar depreferred_language. Este desajuste se documenta aquí para que no seolvide.

D-AUT-01.7 — Sin dependencias nuevas
No se añadió ningún paquete npm nuevo. Se reutilizan axios,@ionic/angular, @capacitor/preferences y @ionic/storage-angular yapresentes en package.json. El plugin de almacenamiento seguro (RF-AUT-05)se evaluará cuando llegue esa fase.

D-AUT-01.8 — Correo saliente fuera de alcance
RF-AUT-01 no requiere envío de correo (eso es RF-AUT-03 recuperación yRF-AUT-04 verificación). El campo email_verified_at queda NULL parausuarios nuevos; cuando se implemente RF-AUT-04 se completará.

3. Lo que NO se hizo (fuera de alcance de esta fase)
RF-AUT-02 a RF-AUT-08 (otros requerimientos del módulo).
Tabla auth_tokens (token hasheado + caducidad deslizante 30 días).
Almacenamiento seguro del token (Keychain/Keystore).
Recuperación de contraseña.
Verificación de correo.
Bloqueo temporal tras 5 logins fallidos.
Ocultar configuración de IP en producción.
Migración de fotos base64 existentes a archivos (avatar_path).
Refactor de perfil_api.php para usar language en lugar depreferred_language.
Orden recomendado para copiar
Primero la BD → ejecuta 001_users_alter_for_register.sql en phpMyAdmin contra login_db.
Luego el backend → copia register.php a C:\xampp\htdocs\api\.
Luego el frontend, en este orden:
src/app/services/auth.models.ts (nuevo)
src/app/services/auth.service.ts (nuevo)
src/app/login/login.models.ts (nuevo)
src/app/login/login.service.ts (reemplaza)
src/app/login/login.page.ts (reemplaza)
src/app/login/login.page.html (reemplaza)
src/app/login/login.page.scss (reemplaza)
src/app/register/register.page.ts (nuevo)
src/app/register/register.page.html (nuevo)
src/app/register/register.page.scss (nuevo)
src/app/register/register.page.spec.ts (nuevo)
src/app/app.routes.ts (reemplaza)
Documentación → DECISIONES.md en la raíz de 9C/.
Verificación
Inicia Apache y MySQL en XAMPP.
npm start desde 9C/.
Abre http://localhost:8100/login, pulsa «Crear cuenta».
Regístrate con un correo nuevo → debe llevarte a /user-tabs/inicio.
Intenta registrarte de nuevo con el mismo correo → debe mostrar el error en el campo de correo.


RF-AUT-02 — Inicio de sesión robusto
D-AUT-02.1 — Mensaje genérico para credenciales inválidas
El servidor responde lo mismo (Correo o contraseña incorrectos) tantosi el correo no existe (404) como si la contraseña es incorrecta (401).Esto evita la enumeración de cuentas: un atacante no puede saber quécorreos están registrados.

D-AUT-02.2 — Rate-limit compartido por correo e IP
Se reutilizó la tabla login_attempts creada en RF-AUT-01. La condiciónde bloqueo es: 5 intentos fallidos en 15 min para el mismo correo Opara la misma IP (lo que ocurra primero). Esto cubre dos vectores:

Ataque dirigido a una cuenta conocida → bloquea por correo.
Ataque de fuerza bruta desde una IP probando varios correos → bloquea por IP.
D-AUT-02.3 — Cálculo de retry_after en el bloqueo
Cuando se dispara el 429, el servidor calcula cuántos segundos faltanpara que caduque el intento fallido más viejo dentro de la ventana de15 min. Así el cliente puede mostrar una cuenta regresiva precisa(Espera 12:34) en lugar de un mensaje vago.

D-AUT-02.4 — remember_me y expiración del token
Se añadió la columna users.token_expires_at (migración 003, opcional).

remember_me = true → token caduca en 30 días.
remember_me = false → token caduca en 24h.
El login guarda ese timestamp en Preferences con la clavetoken_expires_at. La validación real (rechazar peticiones con tokenexpirado en el middleware de cada endpoint) se hará en RF-AUT-05 juntocon el paso a la tabla auth_tokens.

D-AUT-02.5 — Cuenta desactivada se revisa DESPUÉS de la contraseña
El orden en login.php es: rate-limit → buscar usuario → verificarcontraseña → verificar is_active. Esto es deliberado: si un atacanteintenta usar credenciales correctas de una cuenta desactivada, norevelamos que la cuenta existe hasta que la contraseña sea correcta.Solo entonces devolvemos 403 con el mensaje específico.

D-AUT-02.6 — Limpieza de intentos tras login exitoso
Tras un login correcto, el servidor borra los intentos fallidos de eseemail + ip en login_attempts. Esto evita que un usuario que falló4 veces y luego acertara acumule intentos fantasma que lo bloqueendespués.

D-AUT-02.7 — URL pendiente respeta el rol
Si el interceptor 401 (RF-AUT-06) o un guard guardan una URL enPreferences con la clave pending_url, el login intenta volver a ellasolo si pertenece al rol correcto (/tabs/* para admin,/user-tabs/* para user). Si la URL guardada es del otro rol, seignora y se va al home por defecto. Evita que un user redirija a unadmin a una ruta prohibida (o viceversa) manipulando el storage.

D-AUT-02.8 — attempts_remaining solo se muestra al final
El servidor devuelve cuántos intentos quedan en cada 401, pero elcliente solo lo muestra al usuario cuando faltan 2 o menos. Así no sele da a un atacante una cuenta regresiva exacta desde el primer intento.

D-AUT-02.9 — Placeholder para recuperación de contraseña
El enlace «¿Olvidaste tu contraseña?» ya existe en la UI pero apunta aun método vacío (irARecuperar() con TODO). Se completará en RF-AUT-03.

Cambios por archivo (RF-AUT-02)
Archivo	Estado
backend/migrations/002_login_attempts_alter.sql	nuevo (idempotente)
backend/migrations/003_users_token_expires.sql	nuevo (opcional, expiración de token)
C:\xampp\htdocs\api\login.php	reemplazado (rate-limit, 429, 403, remember_me)
src/app/login/login.models.ts	reemplazado (añade remember_me, token_expires_in, attempts_remaining, retry_after)
src/app/login/login.service.ts	reemplazado (guarda token_expires_at en Preferences)
src/app/login/login.page.ts	reemplazado (manejo 429/403/401, cuenta regresiva, redirección por rol con URL pendiente)
src/app/login/login.page.html	reemplazado (campo contraseña con ojo, checkbox «Mantener sesión», enlaces inferiores)
src/app/login/login.page.scss	reemplazado (estilos de .password-wrap, .remember-row, .links-row)
AC verificados
AC	Cómo se cumple
5 intentos incorrectos → 6.º recibe 429 aunque la contraseña sea correcta	login.php cuenta intentos fallidos antes de validar credenciales; al 6.º entra en el bloque 429 sin verificar password.
Cuenta con is_active = false no inicia sesión y ve mensaje específico	Después de password_verify exitoso, se revisa is_active; si es 0 → 403 con "Tu cuenta está desactivada. Contacta al administrador.".