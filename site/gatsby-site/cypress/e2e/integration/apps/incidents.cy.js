import incident from '../../../fixtures/incidents/incident112.json';
import updateOneIncident from '../../../fixtures/incidents/updateOneIncident112.json';
import incidents from '../../../fixtures/incidents/incidents.json';

describe('Incidents App', () => {
  const url = '/apps/incidents';

  it('Successfully loads', () => {
    cy.visit(url);
  });

  it('Should display a list of incidents', () => {
    cy.visit(url);

    cy.get('[data-cy="row"]').should('have.length.at.least', 10);
  });

  it.skip('Successfully filter and edit incident 112', { retries: { runMode: 4 } }, () => {
    cy.login(Cypress.env('e2eUsername'), Cypress.env('e2ePassword'));

    cy.conditionalIntercept(
      '**/graphql',
      (req) => req.body.operationName == 'FindIncidents',
      'FindIncidents',
      incidents
    );

    cy.conditionalIntercept(
      '**/graphql',
      (req) =>
        req.body.operationName == 'FindIncident' && req.body.variables.query.incident_id == 112,
      'FindIncident112',
      incident
    );

    // this shuold not be necessary and fixed in the component

    cy.conditionalIntercept(
      '**/graphql',
      (req) =>
        req.body.operationName == 'FindIncident' && req.body.variables.query.incident_id == 0,
      'FindIncident0',
      incident
    );

    cy.conditionalIntercept(
      '**/graphql',
      (req) => req.body.operationName == 'FindEntities',
      'FindEntities',
      {
        data: {
          entities: [
            { __typename: 'Entity', entity_id: 'Youtube', name: 'youtube' },
            { __typename: 'Entity', entity_id: 'Google', name: 'google' },
          ],
        },
      }
    );

    cy.visit(url);

    cy.waitForStableDOM();

    cy.wait(['@FindIncident0', '@FindEntities']);

    cy.get('[data-cy="input-filter-Incident ID"]').type('112');

    cy.clickOutside();

    cy.get('[data-cy="row"]').should('have.length', 1);

    cy.contains('Edit').click();

    cy.waitForStableDOM();

    cy.get('[data-cy="incident-form"]', { timeout: 12000 }).should('exist').as('form');

    cy.get('.submission-modal').find('h3').contains('Edit Incident 112').should('exist');

    cy.get(`[data-cy=title-input]`).scrollIntoView().clear().type('Test title');

    cy.get('[data-cy=description-input]').clear().type('New description');

    cy.get('[data-cy=date-input]').clear().type('2023-05-04');

    cy.get('[data-cy=alleged-deployer-of-ai-system-input] input')
      .first()
      .type('Test Deployer{enter}');

    cy.get('[data-cy=editors-input] input').first().type('Pablo Costa{enter}');

    cy.conditionalIntercept(
      '**/graphql',
      (req) => req.body.operationName == 'IncidentWithReports',
      'IncidentWithReports'
    );

    cy.get('[data-cy="similar-id-input"]').type('4');

    cy.wait('@IncidentWithReports');

    cy.get('[data-cy="related-byId"] [data-cy="similar"]').first().click();

    cy.conditionalIntercept(
      '**/graphql',
      (req) => req.body.operationName == 'UpdateIncident',
      'UpdateIncident',
      updateOneIncident
    );

    cy.conditionalIntercept(
      '**/graphql',
      (req) =>
        req.body.operationName == 'UpsertEntity' &&
        req.body.variables.entity.entity_id == 'youtube',
      'UpsertYoutube',
      {
        data: {
          upsertOneEntity: { __typename: 'Entity', entity_id: 'youtube', name: 'Youtube' },
        },
      }
    );

    cy.conditionalIntercept(
      '**/graphql',
      (req) =>
        req.body.operationName == 'UpsertEntity' && req.body.variables.entity.entity_id == 'google',
      'UpsertGoogle',
      {
        data: {
          upsertOneEntity: { __typename: 'Entity', entity_id: 'google', name: 'Google' },
        },
      }
    );

    cy.conditionalIntercept(
      '**/graphql',
      (req) =>
        req.body.operationName == 'UpsertEntity' &&
        req.body.variables.entity.entity_id == 'test-deployer',
      'UpsertTestDeployer',
      {
        data: {
          upsertOneEntity: {
            __typename: 'Entity',
            entity_id: 'test-deployer',
            name: 'Test Deployer',
          },
        },
      }
    );

    cy.contains('Update').scrollIntoView().click();

    cy.wait('@UpsertYoutube')
      .its('request.body.variables.entity.entity_id')
      .should('eq', 'youtube');

    cy.wait('@UpsertGoogle').its('request.body.variables.entity.entity_id').should('eq', 'google');

    cy.wait('@UpsertTestDeployer')
      .its('request.body.variables.entity.entity_id')
      .should('eq', 'test-deployer');

    cy.wait('@UpdateIncident').then((xhr) => {
      expect(xhr.request.body.operationName).to.eq('UpdateIncident');
      expect(xhr.request.body.variables.query.incident_id).to.eq(112);
      expect(xhr.request.body.variables.set.title).to.eq('Test title');
      expect(xhr.request.body.variables.set.description).to.eq('New description');
      expect(xhr.request.body.variables.set.date).to.eq('2023-05-04');

      expect(xhr.request.body.variables.set.editors).to.have.length(2);
      expect(xhr.request.body.variables.set.editors).to.contain('Anonymous');
      expect(xhr.request.body.variables.set.editors).to.contain('Pablo Costa');

      expect(xhr.request.body.variables.set.AllegedDeployerOfAISystem.link).to.have.length(2);
      expect(xhr.request.body.variables.set.AllegedDeployerOfAISystem.link).to.contain('youtube');
      expect(xhr.request.body.variables.set.AllegedDeployerOfAISystem.link).to.contain(
        'test-deployer'
      );

      expect(xhr.request.body.variables.set.AllegedDeveloperOfAISystem.link).to.have.length(1);
      expect(xhr.request.body.variables.set.AllegedDeveloperOfAISystem.link).to.contain('youtube');

      expect(xhr.request.body.variables.set.AllegedHarmedOrNearlyHarmedParties.link).to.have.length(
        1
      );
      expect(xhr.request.body.variables.set.AllegedHarmedOrNearlyHarmedParties.link).to.contain(
        'google'
      );

      expect(xhr.request.body.variables.set.nlp_similar_incidents).to.have.length(0);
      expect(xhr.request.body.variables.set.editor_similar_incidents).to.contain(4);
      expect(xhr.request.body.variables.set.editor_dissimilar_incidents).to.have.length(0);
      expect(xhr.request.body.variables.set.flagged_dissimilar_incidents).to.have.length(0);
    });

    cy.get('[data-cy="incident-form"]').should('not.exist');

    cy.get('[data-cy="toast"]').contains('Incident 112 updated successfully.').should('exist');
  });

  it('Entities should link to entities page', () => {
    cy.conditionalIntercept(
      '**/graphql',
      (req) => req.body.operationName == 'FindIncidents',
      'FindIncidents',
      incidents
    );

    cy.conditionalIntercept(
      '**/graphql',
      (req) => req.body.operationName == 'FindIncident',
      'FindIncident',
      incident
    );

    cy.visit(url);

    cy.waitForStableDOM();

    cy.wait('@FindIncidents');

    cy.get('[data-testid="flowbite-toggleswitch-toggle"]').click();

    cy.get('[data-cy="row"]')
      .eq(0)
      .within(() => {
        const { 0: incident } = incidents.data.incidents;

        cy.get('[data-cy="cell"]')
          .eq(4)
          .then(($element) => {
            cy.wrap($element)
              .find('[data-cy="cell-entity-link"]')
              .each(($el, index) => {
                cy.wrap($el)
                  .should('have.attr', 'href')
                  .and(
                    'include',
                    `/entities/${incident.AllegedDeployerOfAISystem[index].entity_id}`
                  );
              });
          });

        cy.get('[data-cy="cell"]')
          .eq(5)
          .then(($element) => {
            cy.wrap($element)
              .find('[data-cy="cell-entity-link"]')
              .each(($el, index) => {
                cy.wrap($el)
                  .should('have.attr', 'href')
                  .and(
                    'include',
                    `/entities/${incident.AllegedDeveloperOfAISystem[index].entity_id}`
                  );
              });
          });

        cy.get('[data-cy="cell"]')
          .eq(6)
          .then(($element) => {
            cy.wrap($element)
              .find('[data-cy="cell-entity-link"]')
              .each(($el, index) => {
                cy.wrap($el)
                  .should('have.attr', 'href')
                  .and(
                    'include',
                    `/entities/${incident.AllegedHarmedOrNearlyHarmedParties[index].entity_id}`
                  );
              });
          });
      });
  });

  it('Should display a list of live incidents', () => {
    cy.conditionalIntercept(
      '**/graphql',
      (req) => req.body.operationName == 'FindIncidents',
      'FindIncidents',
      incidents
    );

    cy.conditionalIntercept(
      '**/graphql',
      (req) => req.body.operationName == 'FindIncident',
      'FindIncident',
      incident
    );

    cy.visit(url);

    cy.waitForStableDOM();

    cy.wait('@FindIncidents');

    cy.get('[data-testid="flowbite-toggleswitch-toggle"]').click();

    cy.get('[data-cy="row"]')
      .eq(0)
      .within(() => {
        cy.get('[data-cy="cell"]').should('have.length', 7);

        const { 0: incident } = incidents.data.incidents;

        cy.get('[data-cy="cell"]').eq(0).should('have.text', `Incident ${incident.incident_id}`);
        cy.get('[data-cy="cell"]').eq(1).should('have.text', incident.title);
        cy.get('[data-cy="cell"]').eq(2).should('have.text', incident.description);
        cy.get('[data-cy="cell"]').eq(3).should('have.text', incident.date);
        cy.get('[data-cy="cell"]')
          .eq(4)
          .should('have.text', incident.AllegedDeployerOfAISystem.map((i) => i['name']).join(', '));
        cy.get('[data-cy="cell"]')
          .eq(5)
          .should(
            'have.text',
            incident.AllegedDeveloperOfAISystem.map((i) => i['name']).join(', ')
          );
        cy.get('[data-cy="cell"]')
          .eq(6)
          .should(
            'have.text',
            incident.AllegedHarmedOrNearlyHarmedParties.map((i) => i['name']).join(', ')
          );
      });
  });

  it('Should navigate to the last page, and the first page', () => {
    cy.visit(url);

    cy.get('[data-cy="last-page"]').click();

    cy.get('[data-cy="total-pages"]')
      .invoke('text')
      .then((text) => {
        cy.get('[data-cy="current-page"]').should('have.text', text);
      });

    cy.get('[data-cy="first-page"]').click();

    cy.get('[data-cy="current-page"]').should('have.text', '1');
  });
});
