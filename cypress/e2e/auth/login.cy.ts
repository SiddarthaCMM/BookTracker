describe('🔐 Autenticación', () => {
  beforeEach(() => {
    cy.mockApi('POST', 'login.php', {
      success: true,
      message: 'Login exitoso',
      user_id: 1,
      token: 'fake-token',
      role: 'admin',
    });
  });

  it('login admin redirige a /tabs', () => {
    cy.login('admin@test.com', '123456', 'admin');
    cy.url().should('include', '/tabs/tab1');
  });

  it('login user redirige a /user-tabs', () => {
    cy.mockApi('POST', 'login.php', {
      success: true, user_id: 2, token: 't', role: 'user', message: 'ok',
    });
    cy.login('user@test.com', '123456', 'user');
    cy.url().should('include', '/user-tabs');
  });

  it('credenciales inválidas muestran toast de error', () => {
    cy.mockApi('POST', 'login.php', { success: false, message: 'Usuario no encontrado' }, 404);
    cy.visit('/login');
    cy.get('input[name="email"]').type('malo@test.com');
    cy.get('input[name="password"]').type('wrong');
    cy.get('input[type="submit"]').click();
    cy.waitForToast('Usuario no encontrado');
  });

  it('campos vacíos muestran validación HTML5', () => {
    cy.visit('/login');
    cy.get('input[type="submit"]').click();
    // No se llama a la API
    cy.url().should('include', '/login');
  });

  it('botón engranaje abre modal de configuración IP', () => {
    cy.visit('/login');
    cy.get('ion-button').find('ion-icon[name="settings-outline"]').click({ force: true });
    cy.get('ion-modal').should('be.visible');
    cy.get('ion-modal').contains('IP del Servidor').should('be.visible');
  });
});