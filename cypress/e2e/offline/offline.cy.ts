describe('📴 Modo Offline', () => {
  beforeEach(() => {
    cy.mockApi('POST', 'login.php', { success: true, user_id: 1, token: 't', role: 'admin', message: 'ok' });
    cy.mockApi('GET', 'usuarios_api.php', { success: true, data: [
      { id: 1, email: 'admin@test.com', created_at: '2026-01-01' },
    ]});
    cy.login('admin@test.com', '123456', 'admin');
  });

  it('badge OFFLINE no aparece con conexión', () => {
    cy.get('ion-badge').should('not.exist'); 
  });

  it('muestra badge OFFLINE cuando falla la red', () => {
    cy.window().then((w) => w.dispatchEvent(new w.Event('offline')));
    cy.get('ion-badge').contains('OFFLINE').should('be.visible');
  });

  it('muestra datos de caché cuando no hay red', () => {
    // Primero dejamos que cargue y cachee
    cy.visit('/tabs/tab1');
    cy.contains('admin@test.com').should('be.visible');

    // Ahora cortamos la red
    cy.intercept('GET', '**/api/usuarios_api.php', { forceNetworkError: true }).as('fail');
    cy.reload();
    cy.wait('@fail');
    cy.contains('admin@test.com').should('be.visible'); // sigue visible gracias al caché
    cy.waitForToast('Sin conexión');
  });
});