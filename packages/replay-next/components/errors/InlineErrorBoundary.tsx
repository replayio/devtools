import { captureException } from "@sentry/browser";
import ErrorStackParser from "error-stack-parser";
import { ErrorInfo, ReactElement, useCallback } from "react";
import { ErrorBoundary, ErrorBoundaryProps } from "react-error-boundary";

import { InlineErrorFallback } from "replay-next/components/errors/InlineErrorFallback";
import { recordData } from "replay-next/src/utils/telemetry";
import { CommandErrorArgs, isCommandError } from "shared/utils/error";

// This error boundary handles non-fatal errors.
// For example if a component throws an error while Suspending, this boundary will show an inline error
// but the surrounding application will continue to work.
//
// This boundary can be configured to reset its internal state and "retry" the error using either a "key" or "resetKey" prop.
// The "resetKey" key prop will not destroy child component state when it changes.

type ParsedStackFrame = {
  columnNumber: number | undefined;
  fileName: string | undefined;
  lineNumber: number | undefined;
};

export function InlineErrorBoundary({
  children,
  fallback,
  name,
  resetKey,
  ...rest
}: Omit<ErrorBoundaryProps, "fallback" | "fallbackRender" | "FallbackComponent" | "resetKeys"> & {
  fallback?: ReactElement | null;

  // Uniquely identifies this error boundary; logged to Sentry.
  name: string;

  // If `resetKey` changes after the ErrorBoundary caught an error, it will reset its state.
  // Use `resetKey` instead of `key` if you don't want the child components to be recreated
  // (and hence lose their state) every time the key changes.
  resetKey?: string | number;
}) {
  const onError = useCallback(
    (error: Error, info: ErrorInfo) => logErrorToSentry(error, info, name),
    [name]
  );

  return (
    <ErrorBoundary
      fallback={fallback !== undefined ? fallback : <InlineErrorFallback />}
      onError={onError}
      resetKeys={resetKey ? [resetKey] : undefined}
      {...rest}
    >
      {children}
    </ErrorBoundary>
  );
}

function logErrorToSentry(error: Error, info: ErrorInfo, name: string) {
  console.error(error);

  let callStack: ParsedStackFrame[] | undefined = undefined;
  let commandErrorArgs: CommandErrorArgs | undefined = undefined;
  let errorMessage: string | undefined = undefined;
  let errorName: string | undefined = undefined;

  // Any type of value can be thrown in JavaScript.
  if (error instanceof Error) {
    errorMessage = error.message;
    errorName = error.name;

    if (isCommandError(error)) {
      commandErrorArgs = error.args;
    }

    try {
      callStack = ErrorStackParser.parse(error).map(frame => ({
        columnNumber: frame.columnNumber,
        fileName: frame.fileName,
        lineNumber: frame.lineNumber,
      }));
    } catch (error) {}
  } else if (typeof error === "string") {
    errorMessage = error;
  }

  let componentStack: ParsedStackFrame[] | undefined = undefined;
  try {
    componentStack = ErrorStackParser.parse({
      message: "",
      name: "",
      stack: info.componentStack,
    })
      .filter(frame => {
        // Filter DOM elements from the stack trace.
        return frame.fileName !== undefined;
      })
      .map(frame => ({
        columnNumber: frame.columnNumber,
        fileName: frame.fileName,
        lineNumber: frame.lineNumber,
      }));
  } catch (error) {}

  recordData("component-error-boundary", {
    boundary: name,
    error: {
      name: errorName,
      message: errorMessage,
      callStack,
      componentStack,
    },
    command: commandErrorArgs,
  });

  captureException(error);
}
