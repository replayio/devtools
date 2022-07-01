export function validate(code: string): boolean {
  try {
    new Function(code);
    return true;
  } catch (error) {
    return false;
  }
}
