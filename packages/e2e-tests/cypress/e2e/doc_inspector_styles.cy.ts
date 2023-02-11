describe("doc_inspector_styles", () => {
  beforeEach("visits baseURL", () => {
    cy.visit("/doc_inspector_styles.html");
  });
  it("contains conflict", () => {
    cy.get(`#conflict`).contains("CONFLICT");
  });
});
