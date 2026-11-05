import 'cypress-file-upload';

// ---------- LOGIN ----------
Cypress.Commands.add('login', (email: string, password: string, role: 'admin' | 'user') => {
  cy.visit('/login');
  cy.get('input[name="email"]').clear().type(email);
  cy.get('input[name="password"]').clear().type(password);
  cy.get('input[type="submit"]').click();

  // Esperamos a que el guard nos redirija
  const expectedUrl = role === 'admin' ? '/tabs' : '/user-tabs';
  cy.url().should('include', expectedUrl);
});

// ---------- MOCK API ----------
Cypress.Commands.add('mockApi', (method: string, endpoint: string, response: any, statusCode = 200) => {
  const url = `**/api/${endpoint}`;
  
  // Si response es un string que empieza con "fixture:", cargamos el archivo
  if (typeof response === 'string' && response.startsWith('fixture:')) {
    const fixturePath = response.substring(8); // quita "fixture:"
    cy.fixture(fixturePath).then((data) => {
      cy.intercept(method as any, url, {
        statusCode,
        body: data,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }).as(`api:${endpoint}:${method}`);
    });
  } else {
    // Si es un objeto directo, lo usamos tal cual
    cy.intercept(method as any, url, {
      statusCode,
      body: response,
      headers: { 'Access-Control-Allow-Origin': '*' },
    }).as(`api:${endpoint}:${method}`);
  }
});

// ---------- MOCKS DE CAPACITOR ----------
// Capacitor en web usa polyfills; en Cypress los reemplazamos por stubs controlables
Cypress.Commands.add('mockCapacitor', () => {
  cy.window().then((win) => {
    // Preferences
    const store: Record<string, string> = {};
    (win as any).Capacitor = (win as any).Capacitor || {};
    (win as any).Capacitor.Plugins = (win as any).Capacitor.Plugins || {};
    (win as any).Capacitor.Plugins.Preferences = {
      get: async ({ key }: { key: string }) => ({ value: store[key] ?? null }),
      set: async ({ key, value }: { key: string; value: string }) => {
        store[key] = value;
        return { value };
      },
      remove: async ({ key }: { key: string }) => {
        delete store[key];
        return {};
      },
      clear: async () => {
        Object.keys(store).forEach((k) => delete store[k]);
        return {};
      },
    };

    // Network
    (win as any).Capacitor.Plugins.Network = {
      getStatus: async () => ({ connected: true, connectionType: 'wifi' }),
      addListener: () => ({ remove: async () => {} }),
    };

    // Camera: simula una foto base64
    (win as any).Capacitor.Plugins.Camera = {
      getPhoto: async () => ({
        dataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAg=',
        base64String: '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAg=',
        format: 'jpeg',
      }),
    };

    // Bluetooth LE: simula un dispositivo conectado
    (win as any).Capacitor.Plugins.BluetoothLe = {
      initialize: async () => {},
      requestDevice: async () => ({
        deviceId: 'test-device-id',
        name: 'Kindle Paperwhite',
      }),
      connect: async () => {},
      disconnect: async () => {},
    };
  });
});

// ---------- HELPERS IONIC ----------
// Esperar a que aparezca un toast
Cypress.Commands.add('waitForToast', (text: string) => {
  cy.get('ion-toast', { timeout: 10000 }).should(($t) => {
    expect(String(($t[0] as any).message ?? '')).to.include(text);
  });
});

// Hacer click en un ion-button por su texto
Cypress.Commands.add('clickIonButton', (text: string) => {
  cy.get('ion-button').contains(text).first().click({ force: true });
});

Cypress.Commands.add('typeIonInput', (label: string, value: string) => {
  cy.contains('ion-item', label)
    .find('input', { includeShadowDom: true })
    .first()
    .clear({ force: true })
    .type(value, { force: true })
    // Esto es lo que faltaba: dispara el evento input para que Angular actualice ngModel
    .then($input => {
      $input[0].dispatchEvent(new Event('input', { bubbles: true }));
    });
});

// ---------- CICLO DE SESIÓN ----------
beforeEach(() => {
  cy.mockCapacitor();
  cy.clearLocalStorage();
  cy.clearCookies();
});

// Tipos
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string, role: 'admin' | 'user'): Chainable;
      mockApi(method: string, endpoint: string, response: any, statusCode?: number): Chainable;
      mockCapacitor(): Chainable;
      waitForToast(text: string): Chainable;
      clickIonButton(text: string): Chainable;
      typeIonInput(label: string, value: string): Chainable;
    }
  }
}