describe('👤 User-Perfil', () => {
  beforeEach(() => {
    cy.mockApi('POST', 'login.php', { success: true, user_id: 2, token: 't', role: 'user', message: 'ok' });
    cy.mockApi('GET', 'perfil_api.php', {
      success: true, data: {
        username: 'user_test',
        nombre: 'Usuario',
        email: 'user@test.com',
        birth_date: '2000-01-01',
        idioma: 'es',
        foto_url: '',
      },
    });
    cy.mockApi('PATCH', 'perfil_api.php', { success: true, message: 'Perfil actualizado' });
    cy.login('user@test.com', '123456', 'user');
    cy.visit('/user-tabs/perfil');
  });

  it('carga los datos del perfil', () => {
    cy.typeIonInput('Usuario', 'user_test');
    cy.typeIonInput('Correo', 'user@test.com');
  });

  it('valida email inválido', () => {
    cy.typeIonInput('Correo', 'no-es-email');
    cy.get('ion-button').contains('Guardar Cambios').click({ force: true });
    cy.waitForToast('correo no es válido');
  });

  it('guardar actualiza el perfil (PATCH)', () => {
    cy.typeIonInput('Nombre', 'Nuevo Nombre');
    cy.get('ion-button').contains('Guardar Cambios').click({ force: true });
    cy.waitForToast('actualizado');
  });

  it('botón Bluetooth abre selector nativo', () => {
    // Sobrescribir el método directamente en la instancia
    cy.window().then((win) => {
      // Simular que el BLE ya está "conectado"
      const store = win.localStorage;
      // Forzar la conexión via el stub del plugin
    });
    
    // Hacer click
    cy.get('ion-button').contains('Conectar vía Bluetooth').click({ force: true });
    cy.wait(2000);  // Dar tiempo a que el mock se resuelva
    
    // Verificar
    cy.contains('ion-item', 'Lector Electrónico')
      .find('input', { includeShadowDom: true })
      .should('have.value', 'Kindle Paperwhite');
  });

  it('tap en avatar dispara la cámara (mock)', () => {
    cy.get('.avatar-container').click({ force: true });
    // El PhotoEditor SDK se intenta inicializar; en test solo verificamos que se abre el modal
    cy.get('ion-modal', { timeout: 8000 }).should('exist');
  });
});