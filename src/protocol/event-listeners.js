// Routines for finding framework-specific event listeners within a pause.

async function getFrameworkEventListeners(node) {
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

function logpointGetFrameworkEventListeners(frameId, frameworkListeners) {
  const evalText = `
(array => {
  const rv = [];
  for (const maybeEvent of array) {
    if (!(maybeEvent instanceof Event)) {
      continue;
    }
    for (let node = maybeEvent.target; node; node = node.parentNode) {
      const props = Object.getOwnPropertyNames(node);
      const reactProp = props.find(v => v.startsWith("__reactEventHandlers$"));
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

module.exports = {
  getFrameworkEventListeners,
  logpointGetFrameworkEventListeners,
};
