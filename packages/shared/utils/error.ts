export function isUnloadedRegionError(error: any) {
  return (
    error instanceof Error && error.name === "CommandError" && error.message.includes("unloaded")
  );
}
