/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

describe("asycStoreHelper", () => {
  let asyncStoreHelper;

  beforeEach(() => {
    jest.resetModules();

    const store = {};

    jest.mock("./async-storage", () => ({
      getItem: async key => {
        return store[key];
      },
      setItem: async (key, value) => {
        store[key] = value;
      },
    }));

    asyncStoreHelper = require("./async-store-helper").asyncStoreHelper;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("can get and set values", async () => {
    const asyncStore = asyncStoreHelper("root", { a: "_a" });
    asyncStore.a = 3;
    await expect(await asyncStore.a).toEqual(3);
  });

  it("supports default values", async () => {
    const asyncStore = asyncStoreHelper("root", { a: ["Json", "_a", {}] });
    await expect(await asyncStore.a).toEqual({});
  });

  it("undefined default value", async () => {
    const asyncStore = asyncStoreHelper("root", { a: "_a" });
    await expect(await asyncStore.a).toEqual(null);
  });

  it("setting an undefined mapping", async () => {
    const asyncStore = asyncStoreHelper("root", { a: "_a" });
    expect(() => {
      asyncStore.b = 3;
    }).toThrow("AsyncStore: b is not defined");
  });
});
