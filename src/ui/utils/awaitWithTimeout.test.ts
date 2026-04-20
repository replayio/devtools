import { AwaitTimeout, awaitWithTimeout } from "./awaitWithTimeout";

describe("awaitWithTimeout", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("resolves with the promise value when it settles before the timeout", async () => {
    const result = await awaitWithTimeout(Promise.resolve(42), 10_000);
    expect(result).toBe(42);
  });

  it("resolves with AwaitTimeout when the timeout wins the race", async () => {
    const pending = new Promise<number>(() => {});
    const resultPromise = awaitWithTimeout(pending, 100);
    jest.advanceTimersByTime(100);
    await expect(resultPromise).resolves.toBe(AwaitTimeout);
  });
});
