export async function withExponentialBackoff<T>(
  fn: () => Promise<T>,
  baseBackoffMillis: number,
  maxAttempts: number,
  isRetryableError?: (e: unknown) => boolean
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (e) {
      attempt++;
      if (
        (typeof isRetryableError === "function" && !isRetryableError(e)) ||
        attempt >= maxAttempts
      ) {
        throw e;
      }
      const delay = 2 ** attempt * (baseBackoffMillis / 2);
      const jitter = Math.random() * (baseBackoffMillis / 2);
      await new Promise(r => setTimeout(r, delay + jitter));
    }
  }
}
