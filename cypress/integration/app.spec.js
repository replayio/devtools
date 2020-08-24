/// <reference types="cypress" />

context("Actions", () => {
  before(() => {
    cy.visit("http://localhost:8080/index.html?id=b22f6133-d3ca-4558-a0f5-adb1e2fb5e9c&test=true")
      .get(".progressBar")
      .wait(2000)
      .get(".progressBar.loaded");
  });

  // https://on.cypress.io/interacting-with-elements

  context("Toolbox", () => {
    it("Selecting panels - should switch tabs", () => {
      cy.get("#toolbox-toolbar-inspector")
        .click()
        .should("have.class", "active")
        .get("#toolbox-toolbar-console")
        .click()
        .should("have.class", "active");
    });
  });

  context("Timeline Play buttons", () => {
    beforeEach(() => cy.get(".events-timeline-comments .comment:first-child").click());

    it("Clicking previous seeks to the previous frame", () =>
      cy.get(".command-button .previous").click().get('[data-progress="38"]'));

    it("Clicking next seeks to the next frame", () =>
      cy.get(".command-button .next").click().get('[data-progress="45"]'));

    it("Clicking play continues to the end", () =>
      cy.get(".command-button .play").click().get('[data-progress="100"]'));
  });

  context("Inspector", () => {
    it("Inspect .App styles", () =>
      cy
        .get("#toolbox-toolbar-inspector")
        .click()
        // Find body element
        .get(".tag")
        .contains("body")
        .closest("li.child")
        .find("ul.children")
        .children()
        .should("have.length.above", 4)

        // Find root root element
        .get(".attr-value")
        .contains("root")
        .closest("li.child")
        .scrollIntoView()

        // Expand the root element
        .find(".expander")
        .click()
        .closest("li.child")
        .find("ul.children")
        .children()

        // Find App element
        .get(".attr-value")
        .contains("App")
        .click()

        // Find .App selector
        .get(".ruleview-selector")
        .contains(".App")

        // Find display property
        .get(".ruleview-propertyname")
        .contains("display"));
  });

  context("Debugger", () => {
    it("clicking the first comment navigates to react-dom.production.min.js#1964", () =>
      cy
        .get(".events-timeline-comments .comment:first-child")
        .click()
        .get(".source-tab .filename")
        .should("have.text", "react-dom.production.min.js")
        .get(".debug-expression")
        .should("have.text", "function"));

    it("Adding a logpoint in App.js connect", () => {
      before(() => {
        cy.get(".welcomebox__searchSources")
          .click()
          .get(".search-field input")
          .click()
          .type("App{Enter}")
          .get(".CodeMirror-linenumber")
          .contains("10")
          .window()
          .then(win => win.dbg.getCM().scrollIntoView(209))
          .get(".CodeMirror-linenumber")
          .contains("208")
          .click({ altKey: true })
          .wait(2000);
      });

      it("console has 18 messages", () => cy.get(".message-body").should("have.length", 18));

      it("timeline has 17 markers", () =>
        cy.get(".progressBar a.message").should("have.length", 17));
    });
  });
});
