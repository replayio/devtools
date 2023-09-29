export function validateCode(code: string): boolean {
  try {
    // Wrapping brackets is necessary to support certain types of expressions, e.g. inline objects
    new Function(`[${code}]`);
    return true;
  } catch (error) {
    return false;
  }
}
