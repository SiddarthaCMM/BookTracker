describe('Geolocation modal — successful read', () => {
  const FAKE_LAT = 19.4326;
  const FAKE_LNG = -99.1332;
  const FAKE_ACCURACY = 25;

  beforeEach(() => {
    // Stub navigator.geolocation.getCurrentPosition to call success
    // with a fixed coordinate (CDMX).
    cy.visit('http://localhost:8100', {
      onBeforeLoad(win) {
        const fakeGeo = {
          getCurrentPosition: (success: any, error: any) => {
            success({
              coords: {
                latitude: FAKE_LAT,
                longitude: FAKE_LNG,
                accuracy: FAKE_ACCURACY,
                altitude: null,
                altitudeAccuracy: null,
                heading: null,
                speed: null,
              },
              timestamp: Date.now(),
            });
          },
          watchPosition: () => 0,
          clearWatch: () => {},
        };
        cy.stub(win.navigator, 'geolocation').value(fakeGeo);
      },
    });
  });

  it('shows the coordinates and the closest venue when permission is granted', () => {
    // Open the modal from the login screen
    cy.contains('Probar geolocalización y cámara').click();

    // Tap the button
    cy.contains('Obtener mi ubicación').click();

    // Coordinates should appear with 6 decimals
    cy.contains('Latitud:').should('exist');
    cy.get('.coords-card').should('contain.text', FAKE_LAT.toFixed(6));
    cy.get('.coords-card').should('contain.text', FAKE_LNG.toFixed(6));
    cy.get('.coords-card').should('contain.text', '±' + FAKE_ACCURACY + ' m');

    // Closest venue should be CDMX at ~0 km
    cy.get('.nearest-card').should('contain.text', 'Mi Lector CDMX');
    cy.get('.nearest-card').should('contain.text', '0 km');
  });
});