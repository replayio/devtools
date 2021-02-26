describe("login", () => {
  before(() => {
    cy.login();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
  });

  it("should be able to add and delete comments", () => {
    cy.contains("All");
    cy.get(".recording-item:first-child .item-title").click();

    cy.contains("Transcript and Comments");
    cy.wait(1000);
    cy.get(".add-comment").click();

    cy.contains("Type a comment");
    typeIntoDraftEditor(`[data-testid="draftjs-editor"]`, "Hello World");
    cy.get(".action-submit").click();

    cy.contains("e2e-testing");
    cy.get(".comment-container .comment-body-item").trigger("mouseover");
    cy.get(".comment-actions").click();
    cy.get(".delete-comment").click();
  });
});

const typeIntoDraftEditor = (selector, text) => {
  cy.get(selector).then(input => {
    var textarea = input.get(0);
    textarea.dispatchEvent(new Event("focus"));

    var textEvent = document.createEvent("TextEvent");
    textEvent.initTextEvent("textInput", true, true, null, text);
    textarea.dispatchEvent(textEvent);

    textarea.dispatchEvent(new Event("blur"));
  });
};
