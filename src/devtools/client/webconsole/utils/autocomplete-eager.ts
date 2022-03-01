import { getSelectedFrame } from "devtools/client/debugger/src/selectors";
import { ThreadFront, ValueFront } from "protocol/thread";
import { useCallback } from "react";
import { useSelector } from "react-redux";
import { getPropertiesForObject } from "./autocomplete";

// Use eager eval to get the properties of the last complete object in the expression.
async function getEvaluatedProperties(
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

export function useGetEvaluatedProperties() {
  const frame = useSelector(getSelectedFrame);
  const callback = useCallback(
    (expression: string) =>
      frame ? getEvaluatedProperties(expression, frame.asyncIndex, frame.protocolId) : null,
    [frame]
  );

  return callback;
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
