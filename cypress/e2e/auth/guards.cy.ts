describe('🛡️ Route Guards', () => {
  it('sin sesión, /tabs redirige a /login', () => {
    cy.visit('/tabs/tab1');
    cy.url().should('include', '/login');
  });

  it('sin sesión, /user-tabs redirige a /login', () => {
    cy.visit('/user-tabs');
    cy.url().should('include', '/login');
  });

  it('user logueado no puede entrar a /tabs', () => {
    cy.mockApi('POST', 'login.php', { success: true, user_id: 2, token: 't', role: 'user', message: 'ok' });
    cy.login('user@test.com', '123456', 'user');
    cy.visit('/tabs/tab1');
    cy.url().should('include', '/user-tabs');
  });

  it('admin logueado no puede entrar a /user-tabs', () => {
    cy.mockApi('POST', 'login.php', { success: true, user_id: 1, token: 't', role: 'admin', message: 'ok' });
    cy.login('admin@test.com', '123456', 'admin');
    cy.visit('/user-tabs');
    cy.url().should('include', '/tabs');
  });
});