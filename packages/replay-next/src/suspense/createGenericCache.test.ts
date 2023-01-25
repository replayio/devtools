import { isThennable } from "shared/proxy/utils";

import { createGenericCache } from "./createGenericCache";

describe("Generic suspense cache", () => {
  it("should suspend on async values", async () => {
    const cache = createTestCache();
    try {
      cache.getValueSuspense(1);
      throw new Error("should have suspended");
    } catch (thennable) {
      expect(isThennable(thennable)).toBe(true);
      await thennable;
      expect(cache.getValueSuspense(1)).toBe(1);
    }
  });

  it("should not suspend on sync values", () => {
    const cache = createTestCache();
    expect(cache.getValueSuspense(2)).toBe(2);
  });

  it("should return async values", async () => {
    const cache = createTestCache();
    const thennable = cache.getValueAsync(1);
    expect(isThennable(thennable)).toBe(true);
    await expect(await thennable).toBe(1);
  });

  it("should return sync values", () => {
    const cache = createTestCache();
    expect(cache.getValueAsync(2)).toBe(2);
  });
});

function createTestCache() {
  return createGenericCache<[number], number>(
    "test",
    n => (n % 2 === 0 ? n : Promise.resolve(n)),
    n => `${n}`
  );
}
