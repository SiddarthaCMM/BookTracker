describe('👤 Tab1 - Usuarios (Admin)', () => {
  beforeEach(() => {
    cy.mockApi('POST', 'login.php', { success: true, user_id: 1, token: 't', role: 'admin', message: 'ok' });
    cy.mockApi('GET', 'usuarios_api.php', { success: true, data: [
      { id: 1, email: 'admin@test.com', created_at: '2026-01-01' },
      { id: 2, email: 'user@test.com', created_at: '2026-02-01' },
    ]});
    cy.login('admin@test.com', '123456', 'admin');
    cy.visit('/tabs/tab1');
  });

  it('lista los usuarios', () => {
    cy.contains('admin@test.com').should('be.visible');
    cy.contains('user@test.com').should('be.visible');
  });

  it('crea un usuario nuevo (POST)', () => {
    cy.mockApi('POST', 'usuarios_api.php', { success: true, message: 'Usuario creado', user_id: 3 });
    cy.contains('Nuevo Usuario').click({ force: true });
    cy.get('ion-modal').should('be.visible');
    cy.typeIonInput('Correo electrónico', 'nuevo@test.com');
    cy.typeIonInput('Contraseña', 'mipassword123');
    cy.get('ion-modal').contains('Crear Usuario').click({ force: true });
    cy.waitForToast('Usuario creado');
  });

  it('valida email duplicado (409)', () => {
    cy.mockApi('POST', 'usuarios_api.php', { success: false, message: 'El correo ya está registrado' }, 409);
    cy.contains('Nuevo Usuario').click({ force: true });
    cy.typeIonInput('Correo electrónico', 'admin@test.com');
    cy.typeIonInput('Contraseña', '123456');
    cy.get('ion-modal').contains('Crear Usuario').click({ force: true });
    cy.waitForToast('El correo ya está registrado');
  });

  it('valida email inválido', () => {
    cy.contains('Nuevo Usuario').click({ force: true });
    cy.typeIonInput('Correo electrónico', 'no-es-email');
    cy.typeIonInput('Contraseña', '123456');
    cy.get('ion-modal').contains('Crear Usuario').click({ force: true });
    cy.waitForToast('correo válido');
  });

  it('edita un usuario (PATCH)', () => {
    cy.mockApi('PATCH', 'usuarios_api.php*', { success: true, message: 'Usuario actualizado' });
    cy.get('ion-icon[name="create-outline"]').first().click({ force: true });
    cy.get('ion-modal').should('be.visible');
    cy.typeIonInput('Correo electrónico', 'cambiado@test.com');
    cy.get('ion-modal').contains('Guardar Cambios').click({ force: true });
    cy.waitForToast('actualizado');
  });

  it('elimina con confirmación (DELETE)', () => {
    cy.mockApi('DELETE', 'usuarios_api.php*', { success: true, message: 'Usuario eliminado' });
    cy.get('ion-icon[name="trash-outline"]').last().click({ force: true });
    cy.get('ion-alert').should('be.visible');
    cy.get('ion-alert').contains('button', 'Eliminar').click({ force: true });
    cy.waitForToast('eliminado');
  });

  it('no puede borrarse a sí mismo', () => {
    // El admin actual es id=1, primer fila
    cy.get('tbody tr').first().find('ion-button[disabled]').should('exist');
    // o verificar el botón específico de eliminar
    cy.get('tbody tr').first().find('ion-button').last().should('have.attr', 'disabled');
  });
});