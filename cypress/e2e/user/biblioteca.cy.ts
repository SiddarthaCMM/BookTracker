describe('📖 User-Biblioteca', () => {
  beforeEach(() => {
    cy.fixture('books.json').then((books) => {
      cy.mockApi('POST', 'login.php', { success: true, user_id: 2, token: 't', role: 'user', message: 'ok' });
      cy.mockApi('GET', 'libros_api.php', books);
    });
    cy.login('user@test.com', '123456', 'user');
    cy.visit('/user-tabs/biblioteca');
  });

  it('muestra los libros del usuario', () => {
    cy.contains('El Principito').should('be.visible');
    cy.contains('Cien Años de Soledad').should('be.visible');
  });

  it('muestra estado y páginas', () => {
    cy.contains('Leyendo').should('be.visible');
    cy.contains('50 / 96').should('be.visible');
  });

  it('biblioteca vacía muestra mensaje', () => {
    cy.mockApi('GET', 'libros_api.php', { success: true, data: [] });
    cy.visit('/user-tabs/biblioteca');
    cy.contains('Tu biblioteca está vacía').should('be.visible');
  });
});