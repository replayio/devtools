import React from "react";
import { render, createTestStore } from "test/testUtils";

describe("First example test", () => {
  it("Creates a store without exploding", async () => {
    const store = await createTestStore();
    expect(store.getState().consoleUI).toBeTruthy();
  });
});
