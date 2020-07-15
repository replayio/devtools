/*
BSD 3-Clause License

Copyright (c) 2020, Web Replay LLC
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its
   contributors may be used to endorse or promote products derived from
   this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

// Routines for finding framework-specific event listeners within a pause.

async function getFrameworkEventListeners(node) {
  const obj = node.getObjectFront();
  const props = await obj.loadChildren();
  const reactProp = props.find(v => v.name.startsWith("__reactEventHandlers$"));
  if (!reactProp) {
    return null;
  }

  const handlerProps = await reactProp.contents.loadChildren();
  return handlerProps.filter(({ name, contents }) => {
    return contents.isObject() && contents.className() == "Function";
  }).map(({ name, contents }) => {
    return { handler: contents, type: name, capture: false, tags: "React" };
  });
}

function logpointGetFrameworkEventListeners(frameId, node, datas, frameworkListeners) {
  const evalText = `
(node => {
  const rv = [];
  while (node) {
    const props = Object.getOwnPropertyNames(node);
    const reactProp = props.find(v => v.startsWith("__reactEventHandlers$"));
    if (reactProp) {
      const reactObj = node[reactProp];
      const eventProps = Object.getOwnPropertyNames(reactObj);
      for (const name of eventProps) {
        const v = reactObj[name];
        if (typeof v == "function") {
          rv.push(name, v);
        }
      }
    }
    node = node.parentNode;
  }
  return rv;
})(${node})
`;

  return `
const { result: frameworkResult } = sendCommand(
  "Pause.evaluateInFrame",
  { ${frameId}, expression: \`${evalText}\` }
);
${datas}.push(frameworkResult.data);
${frameworkListeners} = frameworkResult.returned;
`;
}

module.exports = {
  getFrameworkEventListeners,
  logpointGetFrameworkEventListeners,
};
