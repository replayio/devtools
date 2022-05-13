export function assert(v: any, why = ""): asserts v {
  if (!v) {
    const error = new Error(`Assertion Failed: ${why}`);
    error.name = "AssertionFailure";
    console.error("AssertionFailure", error);
    throw error;
  }
}

export function ThrowError(msg: string, tags?: Tags): never {
  const error = new Error(msg);
  error.name = "ThrowError";
  console.error("ThrowError", error, tags);
  throw error;
}
