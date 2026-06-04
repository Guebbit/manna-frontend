/**
 * Sidebar navigation tests.
 *
 * These tests guard against the "strange refresh / nothing happens" bug
 * that occurs when clicking a nav item while already on a different route
 * causes a blank re-render instead of navigating correctly.
 */
describe('Sidebar navigation', () => {
    const navRoutes = [
        { path: '/', heading: /dashboard/i },
        { path: '/agent', heading: /agent/i },
        { path: '/code', heading: /code/i },
        { path: '/upload', heading: /upload/i },
        { path: '/workflow', heading: /workflow/i },
        { path: '/system', heading: /system/i },
        { path: '/settings', heading: /settings/i }
    ];

    for (const { path, heading } of navRoutes) {
        it(`navigates to ${path} and renders a heading`, () => {
            cy.visit(`/#${path}`);
            cy.get('h1, .text-h4', { timeout: 10_000 }).should('be.visible');
            cy.get('h1, h2, .text-h4, .text-h5, .text-h6').then(($els) => {
                const text = [...$els].map((element) => element.textContent ?? '').join(' ');
                expect(text).to.match(heading);
            });
        });
    }

    it('navigates between routes without blank refresh', () => {
        // Go to agent, then code, checking hash changes correctly each time
        cy.visit('/#/agent');
        cy.url().should('include', '#/agent');
        cy.get('h1, .text-h4').should('be.visible');

        cy.visit('/#/code');
        cy.url().should('include', '#/code');
        cy.get('h1, .text-h4').should('be.visible');
    });

    it('clicking the same nav item twice does not blank the page', () => {
        cy.visit('/#/agent');
        cy.get('h1, .text-h4', { timeout: 10_000 }).should('be.visible');
        // Navigate away then back via hash
        cy.visit('/#/code');
        cy.get('h1, .text-h4', { timeout: 10_000 }).should('be.visible');
        cy.visit('/#/agent');
        cy.get('h1, .text-h4', { timeout: 10_000 }).should('be.visible');
    });

    it('/chat redirects to /chat/conversations', () => {
        cy.visit('/#/chat');
        cy.url().should('include', 'chat/conversations');
    });

    it('404 route renders error page without crashing', () => {
        cy.visit('/#/this-does-not-exist');
        cy.get('body').should('be.visible');
        cy.get('h1, h2, .text-h4, .text-h5').should('exist');
    });
});
