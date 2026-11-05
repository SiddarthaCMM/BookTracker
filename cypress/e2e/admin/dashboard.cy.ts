describe('📊 Tab3 - Dashboard (Admin)', () => {
  beforeEach(() => {
    cy.mockApi('POST', 'login.php', { success: true, user_id: 1, token: 't', role: 'admin', message: 'ok' });
    cy.mockApi('GET', 'dashboard_api.php', 'fixture:dashboard.json');
    cy.login('admin@test.com', '123456', 'admin');
    cy.visit('/tabs/tab3');
  });

  it('muestra las 4 tarjetas de métricas', () => {
    cy.contains('Usuarios Totales').should('be.visible');
    cy.contains('Libros Totales').should('be.visible');
    cy.contains('Leyendo Ahora').should('be.visible');
    cy.contains('Libros Leídos').should('be.visible');
  });

  it('muestra los valores correctos', () => {
    cy.contains('2').should('exist'); // total_users
    cy.contains('5').should('exist'); // total_books
    cy.contains('1').should('exist'); // reading_books
    cy.contains('3').should('exist'); // read_books
  });

  it('dibuja las 3 gráficas D3.js', () => {
    cy.get('.d3-chart-container svg').should('have.length.at.least', 3);
  });

  it('gráfica de dona tiene segmentos', () => {
    cy.get('.d3-chart-container').first().find('svg path').should('have.length.at.least', 1);
  });

  it('gráfica de barras tiene rectángulos', () => {
    cy.get('.d3-chart-container').eq(1).find('svg rect').should('have.length.at.least', 1);
  });

  it('gráfica de línea tiene path', () => {
    cy.get('.d3-chart-container').eq(2).find('svg path').should('have.length.at.least', 1);
  });
});