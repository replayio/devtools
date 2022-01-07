export function memoizeLast<TArgs, TResult>(
  fn: (...args: TArgs) => TResult
): (...args: TArgs) => TResult;
