// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

import jwt_decode from "jwt-decode";
import "cypress-localstorage-commands";
import "cypress-real-events/support";

Cypress.Commands.add("login", (overrides = {}) => {
  Cypress.log({
    name: "loginViaAuth0",
  });

  const client_id = Cypress.env("auth_client_id");
  const client_secret = Cypress.env("auth_client_secret");
  const audience = Cypress.env("auth_audience");
  const scope = "openid profile email offline_access";

  const options = {
    method: "POST",
    url: Cypress.env("auth_url"),
    body: {
      grant_type: "password",
      username: Cypress.env("auth_username"),
      password: Cypress.env("auth_password"),
      audience,
      scope,
      client_id,
      client_secret,
    },
  };

  cy.request(options).then(({ body }) => {
    const { access_token, expires_in, id_token } = body;
    const [header, payload, signature] = id_token.split(".");
    const tokenData = jwt_decode(id_token);
    const tokenDataHeader = jwt_decode(id_token, { header: true });
    const key = `@@auth0spajs@@::${client_id}::hasura-api::${scope}`;

    const auth0Cache = {
      body: {
        client_id,
        access_token,
        id_token,
        scope,
        expires_in,
        decodedToken: {
          encoded: { header, payload, signature },
          header: tokenDataHeader,
          // below is returned by getIdTokenClaims
          claims: {
            __raw: id_token,
            ...tokenData,
          },
          user: tokenData,
        },
      },
      expiresAt: Math.floor(Date.now() / 1000) + expires_in,
    };

    cy.setLocalStorage(key, JSON.stringify(auth0Cache));
    cy.setLocalStorage("__cypress", JSON.stringify(auth0Cache));
    cy.visit("/view?e2etest=true");
  });
});
