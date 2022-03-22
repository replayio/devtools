import { getSelectedFrame } from "devtools/client/debugger/src/selectors";
import { GETTERS_FROM_PROTOTYPES } from "devtools/packages/devtools-reps/object-inspector/utils";
import { ThreadFront, ValueFront } from "protocol/thread";
import { useCallback } from "react";
import { useSelector } from "react-redux";
import { getPropertiesForObject } from "ui/utils/autocomplete";

// Use eager eval to get the properties of the last complete object in the expression.
export async function getEvaluatedProperties(
  expression: string,
  asyncIndex: number,
  frameId?: string
): Promise<string[]> {
  try {
    const { returned, exception, failed } = await ThreadFront.evaluate({
      asyncIndex,
      frameId,
      text: expression,
      pure: true,
    });
    if (returned && !(failed || exception)) {
      await returned.traversePrototypeChainAsync(
        current => current.loadIfNecessary(),
        GETTERS_FROM_PROTOTYPES
      );
      return getPropertiesForObject(returned.getObject());
    }
  } catch (err: any) {
    let msg = "Error: Eager Evaluation failed";
    if (err.message) {
      msg += ` - ${err.message}`;
    }
    console.error(msg);
  }

  return [];
}

async function eagerEvaluateExpression(
  expression: string,
  asyncIndex: number,
  frameId?: string
): Promise<ValueFront | null> {
  try {
    const { returned, exception, failed } = await ThreadFront.evaluate({
      asyncIndex,
      frameId,
      text: expression,
      pure: true,
    });
    if (returned && !(failed || exception)) {
      return returned;
    }
  } catch (err: any) {
    let msg = "Error: Eager Evaluation failed";
    if (err.message) {
      msg += ` - ${err.message}`;
    }
    console.error(msg);
  }

  return null;
}

export function useEagerEvaluateExpression() {
  const frame = useSelector(getSelectedFrame);
  const callback = useCallback(
    (expression: string) =>
      frame ? eagerEvaluateExpression(expression, frame.asyncIndex, frame.protocolId) : null,
    [frame]
  );

  return callback;
}
