export interface CommandError extends Error {
  name: "CommandError";
  code: number;
}

export enum ProtocolError {
  InternalError = 1,
  UnsupportedRecording = 31,
  UnknownBuild = 32,
  CommandFailed = 33,
  RecordingUnloaded = 38,
  DocumentIsUnavailable = 45,
  LinkerDoesNotSupportAction = 48,
  InvalidRecording = 50,
  ServiceUnavailable = 51,
  TooManyPoints = 55,
  UnknownSession = 59,
  GraphicsUnavailableAtPoint = 65,
  SessionDestroyed = 66,
  TooManyLocationsToPerformAnalysis = 67,
  SessionCreationFailure = 72,
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
  } else if (typeof error === "string") {
    console.error("Unexpected error type encountered (string):\n", error);

    switch (code) {
      case ProtocolError.TooManyPoints:
        // TODO [BAC-2330] The Analysis endpoint returns an error string instead of an error object.
        // TODO [FE-938] The error string may contain information about the analysis; it may not be an exact match.
        return error.startsWith("There are too many points to complete this operation");
      case ProtocolError.LinkerDoesNotSupportAction:
        return (
          error === "The linker version used to make this recording does not support this action"
        );
    }
  }

  return false;
};
