describe("doc_inspector_styles", () => {
  beforeEach("visits baseURL", () => {
    cy.visit("/test/examples/doc_inspector_styles.html");
  });

  describe("passing", () => {
    it("basic", () => {
      cy.get(`#conflict`).contains("CONFLICT");
    });
    it("with alias", () => {
      cy.get(`#conflict`).as("conflict").contains("CONFLICT");
    });
    it("with then and chai assert", () => {
      cy.get<HTMLDivElement>(`#conflict`).then(el => {
        expect(el.text()).to.equal("CONFLICT");
      });
    });
  });

  it("basic failing", () => {
    cy.get(`#conflict`).contains("🦄", { timeout: 500 });
  });
});
