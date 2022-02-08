import { ThreadFront } from "protocol/thread";
import { getPropertiesForObject } from "./autocomplete";

// Use eager eval to get the properties of the last complete object in the expression.
export async function getEvaluatedProperties(expression: string): Promise<string[]> {
  const { asyncIndex, frameId } = gToolbox.getPanel("debugger")!.getFrameId();

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
