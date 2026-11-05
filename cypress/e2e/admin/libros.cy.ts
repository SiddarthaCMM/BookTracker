describe('📚 Tab2 - Libros (Admin)', () => {
  beforeEach(() => {
    cy.mockApi('POST', 'login.php', { success: true, user_id: 1, token: 't', role: 'admin', message: 'ok' });
    cy.mockApi('GET', 'libros_api.php', { success: true, data: [
      { id: 1, titulo: 'El Principito', autor: 'Saint-Exupéry', isbn: '', paginas_totales: 96, paginas_leidas: 50, estado: 'Leyendo', calificacion: 4, portada_url: '' },
    ]});
    cy.login('admin@test.com', '123456', 'admin');
    cy.visit('/tabs/tab2');
  });

  it('lista libros con barra de progreso', () => {
    cy.contains('El Principito').should('be.visible');
    cy.contains('Saint-Exupéry').should('be.visible');
    
    // En móvil (411px) la columna de progreso está oculta por CSS responsivo.
    // Verificamos que el dato exista en el DOM, aunque no sea visible.
    cy.contains('50 / 96').should('exist');
    
    // Verificamos que la barra de progreso sí se renderice (es la 2da columna, sí visible)
    cy.get('.progress-bar').should('exist');
  });

  it('muestra badge de estado correcto', () => {
    cy.get('.status-badge.status-reading').should('be.visible');
  });

  it('crea un libro nuevo (POST)', () => {
    cy.mockApi('POST', 'libros_api.php', { success: true, message: 'Libro añadido' });
    cy.contains('Añadir Libro').click({ force: true });
    cy.typeIonInput('Título', 'Cien Años de Soledad');
    cy.typeIonInput('Autor', 'García Márquez');
    cy.typeIonInput('Páginas Totales', '400');
    cy.get('ion-modal').contains('Añadir a Estantería').click({ force: true });
    cy.waitForToast('añadido');
  });

  it('valida título y autor obligatorios', () => {
    cy.contains('Añadir Libro').click({ force: true });
    cy.get('ion-modal').contains('Añadir a Estantería').click({ force: true });
    cy.waitForToast('obligatorios');
  });

  it('edita progreso de lectura (PATCH)', () => {
    cy.mockApi('PATCH', 'libros_api.php*', { success: true, message: 'actualizado' });
    cy.get('ion-icon[name="create-outline"]').first().click({ force: true });
    cy.typeIonInput('Páginas Leídas', '96');
    cy.get('ion-modal').contains('Guardar Cambios').click({ force: true });
    cy.waitForToast('actualizado');
  });

  it('elimina libro con confirmación (DELETE)', () => {
    cy.mockApi('DELETE', 'libros_api.php*', { success: true, message: 'eliminado' });
    cy.get('ion-icon[name="trash-outline"]').first().click({ force: true });
    cy.get('ion-alert').contains('button', 'Eliminar').click({ force: true });
    cy.waitForToast('eliminado');
  });
});