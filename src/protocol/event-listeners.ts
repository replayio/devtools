// Routines for finding framework-specific event listeners within a pause.

import { ValueFront } from "./thread";
import { NodeFront } from "./thread/node";

export interface FrameworkEventListener {
  handler: ValueFront;
  type: string;
  capture: boolean;
  tags: string;
}

const REACT_OBJECT_KEYS = {
  16: "__reactEventHandlers$",
  17: "__reactProps$",
};

export async function getFrameworkEventListeners(node: NodeFront) {
  const obj = node.getObjectFront();
  const props = await obj.loadChildren();
  const reactProp = props.find(v => v.name.startsWith("__reactEventHandlers$"));
  if (!reactProp) {
    return [];
  }

  const handlerProps = await reactProp.contents.loadChildren();
  return handlerProps
    .filter(({ name, contents }) => {
      return contents.isObject() && contents.className() == "Function";
    })
    .map(({ name, contents }) => {
      return { handler: contents, type: name, capture: false, tags: "React" };
    });
}

export function logpointGetFrameworkEventListeners(frameId: string, frameworkListeners: string) {
  const evalText = `
  (args => {
    const rv = [];
    try {
      const event = args.find(arg => arg instanceof Event);
      if (!event) {
        return undefined;
      }

      const node = event.target
      const props = Object.getOwnPropertyNames(node);
      const reactObjKey = props.find(v => v.startsWith("${REACT_OBJECT_KEYS[16]}") || v.startsWith("${REACT_OBJECT_KEYS[17]}"));
      if (!reactObjKey) {
        return undefined;
      }
      const reactObj = node[reactObjKey];
      const eventProps = Object.getOwnPropertyNames(reactObj);
      for (const name of eventProps) {
        const v = reactObj[name];
        if (typeof v == "function") {
          rv.push(name, v);
        }
      }
    } catch (e) {
      return undefined;
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
