/// <reference types="cypress" />

context("Actions", () => {
  beforeEach(() => {
    cy.visit("http://localhost:8080/index.html?id=b22f6133-d3ca-4558-a0f5-adb1e2fb5e9c&test=true");
  });

  // https://on.cypress.io/interacting-with-elements

  it("Selecting panels - should switch tabs", () => {
    cy.get("#toolbox-toolbar-inspector")
      .click()
      .should("have.class", "active")
      .get("#toolbox-toolbar-console")
      .click()
      .should("have.class", "active");
  });

  it("Timeline playbuttons should work", () => {
    // click comment
    cy.get(".progressBar")
      .wait(10000)
      .get(".progressBar.loaded")
      .get(".events-timeline-comments .event:first-child")
      .click();

    // click previous
    cy.get(".command-button .previous").click().get('[data-progress="38"]');

    // click next
    cy.get(".command-button .next").click().get('[data-progress="45"]');

    // click play
    cy.get(".command-button .play").click().get('[data-progress="100"]');
  });

  it("selecting a comment should open the debugger", () => {
    cy.get(".progressBar")
      .wait(10000)
      .get(".progressBar.loaded")
      .get(".events-timeline-comments .event:first-child")
      .click()
      .wait(2000)
      .get(".source-tab .filename")
      .should("have.text", "react-dom.production.min.js")
      .get(".debug-expression");
  });
});
