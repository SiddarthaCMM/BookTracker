const os = require('os');
const fs = require('fs');
const path = require('path');

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const devName in interfaces) {
        const iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return '127.0.0.1';
}

const ip = getLocalIP();

const envFileContent = `export const environment = {
  production: false,
  apiUrl: 'http://${ip}/api/'
};
`;

const dir = path.resolve(__dirname, '../src/environments');
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

// Escribimos en environment.ts (usado por defecto)
fs.writeFileSync(path.join(dir, 'environment.ts'), envFileContent);

// Escribimos en environment.development.ts (usado por Angular durante el build)
fs.writeFileSync(path.join(dir, 'environment.development.ts'), envFileContent);

console.log(`✅ Archivos environment generados con la IP: ${ip}`);