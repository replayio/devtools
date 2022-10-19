export interface CommandError extends Error {
  name: "CommandError";
  code: number;
}

export enum ProtocolError {
  RecordingUnloaded = 38,
  TooManyLocationsToPerformAnalysis = 67,
  TooManyPoints = 55,
}

export const commandError = (message: string, code: number): CommandError => {
  const err = new Error(message) as CommandError;
  err.name = "CommandError";
  err.code = code;
  return err;
};

export const isCommandError = (error: unknown, code: number): boolean => {
  if (error instanceof Error) {
    return error.name === "CommandError" && (error as CommandError).code === code;
  } else if (code === ProtocolError.TooManyPoints) {
    if (typeof error === "string") {
      console.error("Unexpected error type encountered (string):", error);

      // TODO [BAC-2330] The Analysis endpoint returns an error string instead of an error object.
      return error === "There are too many points to complete this operation";
    }
  }

  return false;
};
