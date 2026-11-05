describe('🔍 User-Inicio - Búsqueda', () => {
  beforeEach(() => {
    cy.mockApi('POST', 'login.php', { success: true, user_id: 2, token: 't', role: 'user', message: 'ok' });
    cy.mockApi('GET', 'libros_api.php?search=*', { success: true, data: [] });
    cy.mockApi('POST', 'libros_api.php', { success: true, message: 'Libro añadido' });
    cy.login('user@test.com', '123456', 'user');
    cy.visit('/user-tabs/inicio');
  });

  it('no busca con menos de 3 letras', () => {
    cy.get('ion-searchbar input').type('el', { force: true });
    cy.get('.book-card').should('not.exist');
  });

  it('sin resultados locales abre modal de búsqueda externa', () => {
    cy.get('ion-searchbar input').type('el principito', { force: true });
    cy.get('ion-modal').should('be.visible');
    cy.contains('Búsqueda Externa').should('be.visible');
  });

  it('buscar en Open Library trae resultados', () => {
    // Mock de Open Library
    cy.intercept('GET', 'https://openlibrary.org/search.json*', {
      docs: [
        { title: 'El Principito', author_name: ['Antoine de Saint-Exupéry'], cover_i: 123, isbn: ['978-123'], number_of_pages_median: 96 },
      ],
    }).as('openlibrary');

    cy.get('ion-searchbar input').type('el principito', { force: true });
    cy.get('ion-modal').contains('Buscar en Open Library').click({ force: true });
    cy.wait('@openlibrary');
    cy.contains('El Principito').should('be.visible');
  });

  it('añade libro a "Por leer"', () => {
    cy.intercept('GET', 'https://openlibrary.org/search.json*', {
      docs: [{ title: 'El Principito', author_name: ['Saint-Exupéry'], cover_i: 123, isbn: ['978-123'], number_of_pages_median: 96 }],
    });
    cy.get('ion-searchbar input').type('el principito', { force: true });
    cy.get('ion-modal').contains('Buscar en Open Library').click({ force: true });
    cy.get('.book-card').contains('Por leer').click({ force: true });
    cy.waitForToast('Pendiente');
  });

  it('añade libro a "Leído"', () => {
    cy.intercept('GET', 'https://openlibrary.org/search.json*', {
      docs: [{ title: 'El Principito', author_name: ['Saint-Exupéry'], cover_i: 123, isbn: ['978-123'], number_of_pages_median: 96 }],
    });
    cy.get('ion-searchbar input').type('el principito', { force: true });
    cy.get('ion-modal').contains('Buscar en Open Library').click({ force: true });
    cy.get('.book-card').contains('Leído').click({ force: true });
    cy.waitForToast('Leído');
  });
});