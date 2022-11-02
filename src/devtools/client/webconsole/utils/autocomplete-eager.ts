import { PauseId, Value } from "@replayio/protocol";
import { useMemo } from "react";

import { getSelectedFrameId } from "devtools/client/debugger/src/selectors";
import { ThreadFront } from "protocol/thread";
import { useAppSelector } from "ui/setup/hooks";
import { ObjectFetcher, getPropertiesForObject } from "ui/utils/autocomplete";

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
  const selectedFrameId = useAppSelector(getSelectedFrameId);
  const callback = useMemo(
    // eslint-disable-next-line react/display-name
    () => (expression: string) => {
      if (!selectedFrameId) {
        return null;
      }
      return eagerEvaluateExpression(expression, selectedFrameId.pauseId, selectedFrameId.frameId);
    },
    [selectedFrameId]
  );

  return callback;
}
