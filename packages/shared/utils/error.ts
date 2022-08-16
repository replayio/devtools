export function isTooManyPointsError(error: any) {
  return (
    error instanceof Error &&
    error.name === "CommandError" &&
    error.message.includes("too many points")
  );
}

export function isUnloadedRegionError(error: any) {
  return (
    error instanceof Error && error.name === "CommandError" && error.message.includes("unloaded")
  );
}
