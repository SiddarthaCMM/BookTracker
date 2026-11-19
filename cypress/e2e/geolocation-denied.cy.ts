describe('Geolocation modal — permission denied', () => {
  beforeEach(() => {
    cy.visit('http://localhost:8100', {
      onBeforeLoad(win) {
        const fakeGeo = {
          getCurrentPosition: (success: any, error: any) => {
            // Simulate PERMISSION_DENIED (code = 1)
            error({ code: 1, message: 'User denied Geolocation' });
          },
          watchPosition: () => 0,
          clearWatch: () => {},
        };
        cy.stub(win.navigator, 'geolocation').value(fakeGeo);
      },
    });
  });

  it('shows the error card and the retry button when permission is denied', () => {
    cy.contains('Probar geolocalización y cámara').click();
    cy.contains('Obtener mi ubicación').click();

    cy.get('.error-card').should('be.visible');
    cy.get('.error-card').should('contain.text', 'Permiso de ubicación rechazado');
    cy.get('.error-card').contains('Reintentar').should('be.visible');
  });
});