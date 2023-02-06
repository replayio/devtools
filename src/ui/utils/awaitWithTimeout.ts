export const AwaitTimeout = Symbol("await-timeout");
export async function awaitWithTimeout<T>(
  promise: Promise<T>,
  timeout = 500
): Promise<T | typeof AwaitTimeout> {
  return Promise.race([
    new Promise<typeof AwaitTimeout>(resolve => setTimeout(() => resolve(AwaitTimeout), timeout)),
    promise,
  ]);
}
