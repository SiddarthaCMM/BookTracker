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


RF-AUT-03 — Recuperar contraseña
D-AUT-03.1 — Respuesta idéntica para correos existentes e inexistentes
El endpoint forgot_password.php responde siempre lo mismo:"Si el correo existe, recibirás instrucciones...". Si el correo noexiste o la cuenta está desactivada, NO se genera código, NO se envíacorreo, pero la respuesta es idéntica (mismo status, mismo mensaje).Esto evita enumeración de cuentas.

D-AUT-03.2 — Rate-limit comparte tabla con login
Se reutilizó login_attempts con event_type = 'forgot_password'.Límite: 3 solicitudes por hora por correo o por IP. Cuando se excede,la respuesta sigue siendo la misma (no se revela el bloqueo), pero nose genera ni envía ningún código nuevo. El código anterior siguesiendo válido hasta su expiración.

D-AUT-03.3 — Código de 6 dígitos + hash SHA-256
Se optó por código numérico de 6 dígitos (en lugar de token largotipo URL) porque es más fácil de copiar a mano en el móvil. El códigose guarda solo como hash SHA-256 en password_resets.token_hash.Igual que las contraseñas, el código en claro nunca se persiste.

D-AUT-03.4 — Invalidación manual vs DELETE
Pedir un código nuevo NO borra los anteriores de la tabla; los marcacomo used_at = NOW(). Esto permite:

Auditar intentos de recuperación.
Que un código previo ya usado devuelva 410 ("ya fue usado") en lugarde "no existe", lo que da más contexto al usuario legítimo.
D-AUT-03.5 — Revocación de tokens tras cambio de contraseña
La sección 3 del documento dice "se revocan todos los tokens activosde esa cuenta (cierra sesión en todos los dispositivos)". RF-AUT-05aún no se ha implementado, así que por ahora reset_password.phphace UPDATE users SET token = NULL, token_expires_at = NULL paraese usuario. Cuando llegue RF-AUT-05, se añadiráDELETE FROM auth_tokens WHERE user_id = ? en este mismo endpointy la nulificación de users.token quedará como compatibilidad.

D-AUT-03.6 — D-07 correo saliente — modo DEV
La sección 0 del documento exige no introducir dependencias sinjustificar. Como el envío real de correo requiere PHPMailer + SMTPconfigurado (fuera del alcance actual), se creó correo_helper.phpcon un flag DEV_MODE = true que:

En DEV: escribe el correo (con el código) enC:\xampp\htdocs\api\dev_correo.log y además devuelve el códigoen la respuesta JSON (dev_code) para que el desarrollador puedaprobar el flujo sin leer el log.
En PROD (DEV_MODE = false): usaría mail() nativo de PHP (nofiable en XAMPP) o PHPMailer (preferido, comentado en el helper).
Acción pendiente (D-07): antes de desplegar a producción,configurar SMTP real y poner DEV_MODE = false. Esto se resolveráfuera de las fases de RF-AUT cuando se decida el proveedor de correo.

D-AUT-03.7 — Email del destinatario no viaja en la URL
La página /reset-password lee ?email= del query param solo siviene desde /forgot-password (lo pasamos nosotros). Pero elcódigo se valida solo por hash, sin necesidad del correo. Esto evitaque alguien manipule la URL para cambiar la contraseña de otracuenta: aunque adivine el email, necesita el código de 6 dígitosque llegó al correo del dueño legítimo.

D-AUT-03.8 — Enlace opcional desde el correo
Se soporta también aterrizar en /reset-password?code=123456 si elcorreo lleva un enlace con el código precargado. El ngOnInit deResetPasswordPage lo lee y rellena. Como el backend valida solopor hash, el código en URL no expone nada sensible.

Cambios por archivo (RF-AUT-03)
Archivo	Estado
backend/migrations/004_password_resets.sql	nuevo (idempotente)
C:\xampp\htdocs\api\correo_helper.php	nuevo (helper de correo, DEV_MODE)
C:\xampp\htdocs\api\forgot_password.php	nuevo (Paso 1)
C:\xampp\htdocs\api\reset_password.php	nuevo (Paso 3)
src/app/services/auth.models.ts	reemplazado (añade interfaces forgot/reset)
src/app/services/auth.service.ts	reemplazado (añade solicitarRecuperacion y restablecerContrasena)
src/app/forgot-password/forgot-password.page.ts	nuevo
src/app/forgot-password/forgot-password.page.html	nuevo
src/app/forgot-password/forgot-password.page.scss	nuevo
src/app/reset-password/reset-password.page.ts	nuevo
src/app/reset-password/reset-password.page.html	nuevo
src/app/reset-password/reset-password.page.scss	nuevo
src/app/app.routes.ts	reemplazado (añade rutas /forgot-password y /reset-password)
src/app/login/login.page.ts	modificado (método irARecuperar() ahora navega a /forgot-password)
AC verificados
AC	Cómo se cumple
Un código válido cambia la contraseña una sola vez	reset_password.php marca used_at = NOW() tras el cambio. Un segundo intento con el mismo código entra en el bloque if ($reset['used_at'] !== null) → 410.
Reusar el mismo código devuelve 410	Igual que arriba: el 410 devuelve "El código ya fue usado. Solicita uno nuevo.".
Tras el cambio, un token anterior responde 401	reset_password.php hace UPDATE users SET token = NULL, token_expires_at = NULL. La próxima petición del cliente viejo llevará un token que ya no existe en BD → el middleware de los demás endpoints responde 401.
La respuesta del paso 1 es idéntica para correos existentes e inexistentes	forgot_password.php devuelve siempre { success: true, message: "Si el correo existe, recibirás instrucciones..." } sin importar si el usuario existe o está activo. Solo en DEV_MODE añade dev_code (que en producción no se devuelve).
Orden recomendado para aplicar
BD → ejecuta 004_password_resets.sql en phpMyAdmin.
Backend → copia los 3 archivos nuevos en C:\xampp\htdocs\api\:
correo_helper.php
forgot_password.php
reset_password.php
Frontend modelos/servicio → reemplaza auth.models.ts y auth.service.ts.
Frontend páginas → crea las carpetas forgot-password/ y reset-password/ con sus 3 archivos cada una.
Rutas → reemplaza app.routes.ts.
Login → solo cambia el método irARecuperar() (1 línea).
Documentación → pega la nueva sección en DECISIONES.md.
Cómo probar el flujo
npm start.
En /login pulsa «¿Olvidaste tu contraseña?» → llega a /forgot-password.
Escribe un correo que exista en la BD (ej. admin@test.com).
Recibirás el mensaje genérico. En DEV_MODE, debajo aparece una caja amarilla con el código de 6 dígitos.
Pulsa «Ya tengo el código» → llega a /reset-password con el email precargado.
Escribe el código (o se precarga si vienes del enlace del correo) y una nueva contraseña válida.
Pulsa Cambiar contraseña → mensaje de éxito y botón para volver al login.
Intenta iniciar sesión con la contraseña vieja → 401. Con la nueva → 200.
Intenta reusar el mismo código → 410.

RF-AUT-04 — Verificación de correo
D-AUT-04.1 — Código de 6 dígitos, hash SHA-256, 24h de validez
Se reutiliza el mismo patrón de RF-AUT-03 (recuperación decontraseña): código numérico de 6 dígitos, guardado solo como hashSHA-256 en email_verifications. La validez es de 24 horas (no 60min como en recuperación) porque la verificación no es urgente.

D-AUT-04.2 — authGuard nuevo (cualquier rol autenticado)
Los guards existentes (adminGuard, userGuard, guestGuard) sonexclusivos por rol. /verify-email debe ser accesible paracualquier usuario con sesión iniciada (user o admin). Se creóauth.guard.ts que solo verifica que exista un token (sinimportar el rol).

D-AUT-04.3 — Reset de verificación al cambiar el correo
perfil_api.php PATCH revisa si el email cambió respecto alalmacenado. Si es así:

Hace UPDATE users SET email = ?, email_verified_at = NULL.
Invalida códigos anteriores (used_at = NOW()).
Genera uno nuevo y envía correo.
El frontend recarga el perfil tras guardar, por lo que el avisode verificación vuelve a aparecer automáticamente.
D-AUT-04.4 — Rate-limit de reenvío: 3 por hora
resend_verification.php cuenta cuántos códigos ha solicitado elusuario en la última hora. Si ≥ 3 → 429 sin generar código nuevo.Esto evita spam de correos.

D-AUT-04.5 — Fix incidental: preferred_language → language
El perfil_api.php original referenciaba preferred_language,columna que no existe en la base de datos (la migración 001 creólanguage). Al actualizar el GET para añadir email_verified_at,también se corrigió preferred_language → language. Estoresuelve la deuda documentada en D-AUT-01.6.

D-AUT-04.6 — Bloqueo de reseñas públicas sin verificar
El AC menciona que publicar una reseña con correo sin verificardebe devolver 403. Esto se implementará cuando llegue RF-LIB-09(reseñas públicas). El middleware de libros_api.php o el endpointde reseñas verificará email_verified_at antes de permitir lapublicación. Por ahora, el frontend ya muestra el aviso en elperfil, pero no bloquea ninguna acción todavía.

D-AUT-04.7 — Aviso en Perfil, no en todas las pantallas
Se optó por mostrar el aviso solo en la pantalla de Perfil (nocomo un banner global en todas las páginas). Razones:

Menos intrusivo.
El usuario que quiere publicar una reseña verá el error 403 conel mensaje «Verifica tu correo para publicar reseñas» y sabrá iral perfil.
El botón «Reenviar código» está en el aviso, accesible siempre.
Cambios por archivo (RF-AUT-04)
Archivo	Estado
backend/migrations/005_email_verifications.sql	nuevo (idempotente)
C:\xampp\htdocs\api\verify_email.php	nuevo (POST /auth/verify-email)
C:\xampp\htdocs\api\resend_verification.php	nuevo (POST reenviar código)
C:\xampp\htdocs\api\register.php	reemplazado (envía código tras crear usuario)
C:\xampp\htdocs\api\perfil_api.php	reemplazado (añade email_verified_at al GET, resetea al cambiar email, fix preferred_language→language)
src/app/auth.guard.ts	nuevo (acepta cualquier rol autenticado)
src/app/verify-email/verify-email.page.ts	nuevo
src/app/verify-email/verify-email.page.html	nuevo
src/app/verify-email/verify-email.page.scss	nuevo
src/app/services/auth.models.ts	reemplazado (añade VerifyEmailResponse, ResendVerificationResponse)
src/app/services/auth.service.ts	reemplazado (añade verifyEmail, resendVerification)
src/app/user-perfil/perfil.service.ts	reemplazado (añade email_verified_at a Perfil)
src/app/user-perfil/user-perfil.page.ts	reemplazado (añade aviso, reenviarCodigo, irAVerificar)
src/app/user-perfil/user-perfil.page.html	reemplazado (añade ion-card de aviso)
src/app/user-perfil/user-perfil.page.scss	modificado (añade estilos del aviso)
src/app/app.routes.ts	reemplazado (añade ruta /verify-email con authGuard)
AC verificados
AC	Cómo se cumple
Intentar publicar una reseña con correo sin verificar devuelve 403	Se implementará en RF-LIB-09. El frontend ya muestra el aviso en el perfil; el backend bloqueará la publicación cuando llegue ese requerimiento.
Tras verificar, la misma acción funciona	verify_email.php marca email_verified_at = NOW(); las futuras peticiones de publicar reseña verán que no es null y permitirán la acción.

RF-AUT-05 — Sesión y almacenamiento seguro del token
D-AUT-05.1 — Tabla auth_tokens con hash SHA-256
El token se guarda SOLO como token_hash = SHA-256(token) enauth_tokens. Aunque alguien robe la base de datos, no puedereconstruir ningún token válido (SHA-256 es unilateral).

D-AUT-05.2 — Migración perezosa de users.token → auth_tokens
Los tokens que ya estaban en users.token (texto plano) NO semigran de golpe. El auth_middleware.php los busca primero enauth_tokens (hash); si no aparecen, busca en users.token(texto plano). Si lo encuentra ahí, lo inserta en auth_tokens(con hash) y limpia users.token. Así los usuarios con sesiónactiva no son desconectados al desplegar RF-AUT-05.

D-AUT-05.3 — Caducidad deslizante con respetando remember_me
El middleware renueva expires_at en cada uso:

Si quedan < 24h → renueva a 24h.
Si quedan < 30 días → renueva a 30 días.
Si quedan más → no toca (evita alargar indefinidamente).Esto combina caducidad deslizante con el límite máximo de 30 días.
D-AUT-05.4 — Web: token en memoria (no en localStorage)
En navegador, @capacitor-community/secure-storage usa localStorageen claro (no hay Keychain). Por eso SecureStorageService detectala plataforma web y guarda el token solo en memoria del proceso(memoryToken). El requerimiento RF-AUT-05 acepta esto: "ennavegador, mantenerlo en memoria (se pierde al recargar y se pideiniciar sesión)". En nativo sí usa Keystore/Keychain.

D-AUT-05.5 — Logout llama al servidor antes de limpiar local
El orden es: POST /logout → borrar SecureStorage → borrar Preferences →limpiar caché Ionic Storage. Si no hay red, se borra local igual yse registra warning. Pendiente (D-08): encolar revocación cuandovuelva la red (tabla pending_revocations). En esta fase no seimplementa para no añadir otra tabla sin necesidad inmediata.

D-AUT-05.6 — authGuard nuevo (RF-AUT-04) reutilizado para /sessions
La pantalla /sessions está protegida por authGuard (cualquierusuario autenticado, user o admin). No requiere rol específico.

D-AUT-05.7 — device_label desde User-Agent
Al crear el token, se guarda substr($_SERVER['HTTP_USER_AGENT'], 0, 120)como device_label. Es legible en la pantalla de sesiones("Mozilla/5.0 (Linux; Android 13...)"). En una fase futura sepodría enviar desde el cliente un nombre más amigable("iPhone de Ana"), pero eso requiere un cambio en el cliente;por ahora, el User-Agent es suficiente.

D-AUT-05.8 — Revocación de TODOS los tokens al resetear contraseña
reset_password.php ahora usa revocar_todos_los_tokens($pdo, $userId)en lugar de NULLear users.token. Esto cierra sesión en todos losdispositivos, como pide el AC de RF-AUT-03.

D-AUT-05.9 — Sesiones activas (P3) implementada
Se implementó la pantalla opcional /sessions (P3) porque elesfuerzo adicional era mínimo una vez creado sessions_api.php.Lista tokens activos con device_label, last_used_at yexpires_at, y permite revocar cualquiera (excepto la sesiónactual, que se cierra desde el botón de logout del perfil).

Cambios por archivo (RF-AUT-05)
Backend (PHP)
Archivo	Estado
backend/migrations/006_auth_tokens.sql	nuevo (idempotente)
auth_middleware.php	nuevo (helper validar_token, crear_token_sesion, revocar_todos_los_tokens)
logout.php	nuevo
sessions_api.php	nuevo (P3)
login.php	reemplazado (usa crear_token_sesion)
register.php	reemplazado (usa crear_token_sesion)
reset_password.php	reemplazado (usa revocar_todos_los_tokens)
perfil_api.php	modificado (bloque middleware → validar_token)
libros_api.php	modificado (bloque middleware → validar_token)
usuarios_api.php	modificado (bloque middleware → validar_token)
dashboard_api.php	modificado (bloque middleware → validar_token)
verify_email.php	modificado (bloque middleware → validar_token)
resend_verification.php	modificado (bloque middleware → validar_token)
Frontend (Ionic)
Archivo	Estado
package.json	modificado (añade @capacitor-community/secure-storage)
services/secure-storage.service.ts	nuevo
services/auth.service.ts	reemplazado (token en SecureStorage, cerrarSesion llama a /logout)
app.component.ts	reemplazado (interceptor lee token de SecureStorage)
sessions/sessions.page.ts	nuevo (P3)
sessions/sessions.page.html	nuevo
sessions/sessions.page.scss	nuevo
app.routes.ts	reemplazado (añade /sessions)
user-perfil/user-perfil.page.ts	modificado (añade irASesiones)
user-perfil/user-perfil.page.html	modificado (botón «Sesiones activas»)
tabs/tabs.page.ts	modificado (usa AuthService.cerrarSesion)
user-tabs/user-tabs.page.ts	modificado (usa AuthService.cerrarSesion)
AC verificados
AC	Cómo se cumple
Un token revocado responde 401	auth_middleware.php revisa revoked_at IS NULL. Si está revocado → 401 con "Token revocado. Inicia sesión de nuevo.".
Un token caducado responde 401	auth_middleware.php revisa expires_at > NOW(). Si no → 401 con "Tu sesión expiró".
A partir del contenido de auth_tokens no puede reconstruirse ningún token válido	auth_tokens.token_hash contiene SHA-256(token). SHA-256 es unilateral: no se puede invertir para obtener el token original.