import assert from "assert";
import { ComponentType, createElement, useContext } from "react";
import { ErrorBoundaryContext } from "react-error-boundary";

import { ProtocolError, isCommandError } from "shared/utils/error";

export function withSessionTimeoutCheck<Props extends object>(component: ComponentType<Props>) {
  const Wrapper = (props: Props) => {
    const context = useContext(ErrorBoundaryContext);
    assert(context, "ErrorBoundaryContext is not available");

    const { didCatch, error } = context;
    if (didCatch) {
      if (
        isCommandError(error, ProtocolError.UnknownSession) ||
        isCommandError(error, ProtocolError.SessionDestroyed)
      ) {
        throw error;
      }
    }

    return createElement(component, props);
  };

  // Format for display in DevTools
  const name = component.displayName || component.name || "Unknown";
  Wrapper.displayName = `withSessionTimeoutCheck(${name})`;

  return Wrapper;
}
