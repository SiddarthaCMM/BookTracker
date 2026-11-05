/**
 * Genera los archivos de environment con la IP local de esta PC.
 * Uso: node scripts/set-env.js            (autodetecta la IP)
 *      API_HOST=192.168.1.50 node scripts/set-env.js   (IP manual)
 *
 * Se escriben los TRES archivos porque `ng build` (producción, el valor por
 * defecto de `ionic cap sync`) reemplaza environment.ts por environment.prod.ts.
 */
const os = require('os');
const fs = require('fs');
const path = require('path');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  const candidatas = [];
  for (const nombre of Object.keys(interfaces)) {
    for (const alias of interfaces[nombre] || []) {
      // Node >= 18.4 devuelve family como número (4) en algunas versiones
      const esIPv4 = alias.family === 'IPv4' || alias.family === 4;
      if (esIPv4 && !alias.internal) {
        candidatas.push({ nombre, address: alias.address });
      }
    }
  }
  // Ignoramos adaptadores virtuales (VirtualBox, VMware, WSL, Docker, etc.)
  const virtual = /virtual|vmware|vbox|vethernet|wsl|docker|hyper-v|loopback/i;
  const real = candidatas.find((c) => !virtual.test(c.nombre));
  return (real || candidatas[0] || { address: '127.0.0.1' }).address;
}

const host = process.env['API_HOST'] || getLocalIP();

const contenido = (production) => `export const environment = {
  production: ${production},
  apiUrl: 'http://${host}/api/'
};
`;

const dir = path.resolve(__dirname, '../src/environments');
fs.mkdirSync(dir, { recursive: true });

fs.writeFileSync(path.join(dir, 'environment.ts'), contenido(false));
fs.writeFileSync(path.join(dir, 'environment.development.ts'), contenido(false));
fs.writeFileSync(path.join(dir, 'environment.prod.ts'), contenido(true));

console.log(`✅ Archivos environment generados con el host: ${host}`);
