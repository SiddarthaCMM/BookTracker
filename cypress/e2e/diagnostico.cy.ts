describe('diagnóstico toast', () => {
  it('¿dónde queda el toast?', () => {
    cy.visit('/login');
    cy.get('input[type="submit"]').click(); // campos vacíos → toast del cliente
    cy.wait(400);
    cy.document().then((doc) => {
      const ruido = ['ion-content','ion-header','ion-toolbar','ion-title','ion-button','ion-buttons','ion-icon','ion-app','ion-router-outlet'];
      const ion = Array.from(doc.querySelectorAll('*'))
        .map((e) => e.tagName.toLowerCase())
        .filter((t) => t.startsWith('ion-') && !ruido.includes(t));
      const hijosBody = Array.from(doc.body.children).map((e) => e.tagName.toLowerCase());
      expect({ ion: [...new Set(ion)], hijosBody }).to.equal('VER ESTE MENSAJE');
    });
  });
});