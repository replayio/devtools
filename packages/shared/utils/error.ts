export interface CommandError extends Error {
  name: "CommandError";
  code: number;
}

export enum ProtocolError {
  TooManyPoints = 55,
  RecordingUnloaded = 38,
}

export const commandError = (message: string, code: number): CommandError => {
  const err = new Error(message) as CommandError;
  err.name = "CommandError";
  err.code = code;
  return err;
};

export const isCommandError = (error: unknown, code: number): boolean => {
  return (
    error instanceof Error && error.name === "CommandError" && (error as CommandError).code === code
  );
};
