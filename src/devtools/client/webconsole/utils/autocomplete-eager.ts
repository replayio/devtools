import { getSelectedFrame } from "devtools/client/debugger/src/selectors";
import { ThreadFront } from "protocol/thread";
import { useMemo } from "react";
import { useAppSelector } from "ui/setup/hooks";
import { getPropertiesForObject, ObjectFetcher } from "ui/utils/autocomplete";
import { PauseId, Value } from "@replayio/protocol";

// Use eager eval to get the properties of the last complete object in the expression.
// TODO I'm not sure how this is different than the scopes / properties parsing
export async function getEvaluatedProperties(
  expression: string,
  pauseId: PauseId,
  frameId: string | undefined,
  fetchObject: ObjectFetcher
): Promise<string[]> {
  try {
    const { returned, exception } = await ThreadFront.evaluateNew({
      pauseId,
      frameId,
      text: expression,
      pure: true,
    });
    if (returned?.object && !exception) {
      const properties = await getPropertiesForObject(returned.object, fetchObject, 1);
      return properties;
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
  pauseId: PauseId,
  frameId?: string
): Promise<Value | null> {
  try {
    const { returned, exception } = await ThreadFront.evaluateNew({
      pauseId,
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
      return eagerEvaluateExpression(expression, frame.pauseId, frame.protocolId);
    },
    [frame]
  );

  return callback;
}
