export function getFlag(flagName: string): string | null {
  if (typeof window !== "undefined") {
    const url = new URL(window.location.href);
    return url.searchParams.get(flagName);
  }
  return null;
}

export function hasFlag(flagName: string): boolean {
  return getFlag(flagName) !== null;
}
