import debounce from "lodash/debounce";
import { getSelectedFrame } from "devtools/client/debugger/src/selectors";
import { GETTERS_FROM_PROTOTYPES } from "devtools/packages/devtools-reps/object-inspector/items";
import { ThreadFront } from "protocol/thread";
import { useMemo } from "react";
import { useAppSelector } from "ui/setup/hooks";
import { getPropertiesForObject } from "ui/utils/autocomplete";
import { Value } from "@replayio/protocol";

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
): Promise<Value | null> {
  try {
    const { returned, exception } = await ThreadFront.evaluateNew({
      asyncIndex,
      frameId,
      text: expression,
      pure: true,
    });
    if (returned && !exception) {
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
  const frame = useAppSelector(getSelectedFrame);
  const callback = useMemo(
    // eslint-disable-next-line react/display-name
    () => (expression: string) => {
      if (!frame) {
        return null;
      }
      return eagerEvaluateExpression(expression, frame.asyncIndex, frame.protocolId);
    },
    [frame]
  );

  return callback;
}
