// Routines for finding framework-specific event listeners within a pause.

import { ValueFront } from "./thread";
import { NodeFront } from "./thread/node";

export interface FrameworkEventListener {
  handler: ValueFront;
  type: string;
  capture: boolean;
  tags: string;
}

export async function getFrameworkEventListeners(node: NodeFront) {
  const obj = node.getObjectFront();
  await obj.loadProperties();
  const props = Object.entries(obj.previewValueMap());
  const reactProp = props.find(([key]) => key.startsWith("__reactEventHandlers$"));
  if (!reactProp) {
    return [];
  }

  await reactProp[1].loadProperties();
  const handlerProps = Object.entries(reactProp[1].previewValueMap());
  return handlerProps
    .filter(([, contents]) => {
      return contents.isObject() && contents.className() == "Function";
    })
    .map(([name, contents]) => {
      return { handler: contents, type: name, capture: false, tags: "React" };
    });
}

export function logpointGetFrameworkEventListeners(frameId: string, frameworkListeners: string) {
  const evalText = `
(array => {
  const rv = [];
  for (const maybeEvent of array) {
    if (!(maybeEvent instanceof Event)) {
      continue;
    }
    for (let node = maybeEvent.target; node; node = node.parentNode) {
      const props = Object.getOwnPropertyNames(node);
      const reactProp = props.find(v => v.startsWith("__reactEventHandlers$") || v.startsWith("__reactProps$"));
      if (!reactProp) {
        continue;
      }
      const reactObj = node[reactProp];
      const eventProps = Object.getOwnPropertyNames(reactObj);
      for (const name of eventProps) {
        const v = reactObj[name];
        if (typeof v == "function") {
          rv.push(name, v);
        }
      }
    }
  }
  return rv;
})([...arguments])
`;

  return `
const { result: frameworkResult } = sendCommand(
  "Pause.evaluateInFrame",
  { ${frameId}, expression: \`${evalText}\` }
);
addPauseData(frameworkResult.data);
${frameworkListeners} = frameworkResult.returned;
`;
}
