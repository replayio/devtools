/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const { createFactory, createElement } = require("react");

const reps = require("devtools/client/debugger/packages/devtools-reps/src");
const { REPS, MODE } = reps;

const ObjectInspector = createFactory(reps.objectInspector.ObjectInspector.default);

const SmartTrace = require("devtools/client/shared/components/SmartTrace");
const { ObjectFront } = require("protocol/thread");

/**
 * Create and return an ObjectInspector for the given front.
 *
 * @param {Object} grip
 *        The object grip to create an ObjectInspector for.
 * @param {Object} serviceContainer
 *        Object containing various utility functions
 * @param {Object} override
 *        Object containing props that should override the default props passed to
 *        ObjectInspector.
 * @returns {ObjectInspector}
 *        An ObjectInspector for the given grip.
 */
function getObjectInspector(frontOrPrimitiveGrip, serviceContainer, override = {}) {
  let onDOMNodeMouseOver;
  let onDOMNodeMouseOut;
  let onInspectIconClick;

  if (serviceContainer) {
    onDOMNodeMouseOver = serviceContainer.highlightDomElement
      ? object => serviceContainer.highlightDomElement(object)
      : null;
    onDOMNodeMouseOut = serviceContainer.unHighlightDomElement
      ? object => serviceContainer.unHighlightDomElement(object)
      : null;
    onInspectIconClick = serviceContainer.openNodeInInspector
      ? (object, e) => {
          // Stop the event propagation so we don't trigger ObjectInspector expand/collapse.
          e.stopPropagation();
          serviceContainer.openNodeInInspector(object);
        }
      : null;
  }

  const roots = createRoots(frontOrPrimitiveGrip, override.pathPrefix);

  const objectInspectorProps = {
    autoExpandDepth: 0,
    mode: MODE.LONG,
    roots,
    onViewSourceInDebugger: serviceContainer.onViewSourceInDebugger,
    openLink: serviceContainer.openLink,
    sourceMapService: serviceContainer.sourceMapService,
    renderStacktrace: stacktrace =>
      createElement(SmartTrace, {
        key: "stacktrace",
        stacktrace,
        onViewSourceInDebugger: serviceContainer
          ? serviceContainer.onViewSourceInDebugger || serviceContainer.onViewSource
          : null,
        onViewSource: serviceContainer.onViewSource,
        onReady: override.maybeScrollToBottom,
        sourceMapService: serviceContainer ? serviceContainer.sourceMapService : null,
      }),
  };

  Object.assign(objectInspectorProps, {
    onDOMNodeMouseOver,
    onDOMNodeMouseOut,
    onInspectIconClick,
    defaultRep: REPS.Grip,
  });

  if (override.autoFocusRoot) {
    Object.assign(objectInspectorProps, {
      focusedItem: objectInspectorProps.roots[0],
    });
  }

  return ObjectInspector({ ...objectInspectorProps, ...override });
}

function createRoots(valueFront, pathPrefix = "") {
  const id = valueFront.id();

  return [
    {
      path: `${pathPrefix}${id}`,
      contents: valueFront,
    },
  ];
}

module.exports = {
  getObjectInspector,
};
