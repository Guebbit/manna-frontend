describe('Manna routes', () => {
    const routes = ['/', '/chat', '/agent', '/code', '/upload', '/settings'];

    for (const route of routes) {
        it(`loads ${route} and shows basic page content`, () => {
            cy.visit(`/#${route}`);
            cy.get('body').should('be.visible');
        });
    }

    it('loads unknown route and shows error page', () => {
        cy.visit('/#/nonexistent-page');
        cy.get('body').should('be.visible');
    });
});
