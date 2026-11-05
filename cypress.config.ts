import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    includeShadowDom: true,
    baseUrl: 'http://localhost:8100',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    fixturesFolder: 'cypress/fixtures',
    viewportWidth: 411,
    viewportHeight: 820,
    defaultCommandTimeout: 10000,
    video: false,
    screenshotOnRunFailure: false, // <-- Desactivado
  },
});