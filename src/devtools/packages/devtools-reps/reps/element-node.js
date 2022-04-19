/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// ReactJS
const nodeConstants = require("devtools/shared/dom-node-constants");
const PropTypes = require("prop-types");
const { createPrimitiveValueFront } = require("protocol/thread");
const { button, span } = require("react-dom-factories");

// Utils
const { MODE } = require("./constants");
const { isGrip, wrapRender } = require("./rep-utils");
const { rep: StringRep, isLongString } = require("./string");

const MAX_ATTRIBUTE_LENGTH = 50;

/**
 * Renders DOM element node.
 */
ElementNode.propTypes = {
  inspectIconTitle: PropTypes.string,
  // @TODO Change this to Object.values when supported in Node's version of V8
  mode: PropTypes.oneOf(Object.keys(MODE).map(key => MODE[key])),

  object: PropTypes.object.isRequired,
  onDOMNodeClick: PropTypes.func,
  onDOMNodeMouseOut: PropTypes.func,
  onDOMNodeMouseOver: PropTypes.func,
  onInspectIconClick: PropTypes.func,
};

function ElementNode(props) {
  const {
    object,
    inspectIconTitle,
    mode,
    onDOMNodeClick,
    onDOMNodeMouseOver,
    onDOMNodeMouseOut,
    onInspectIconClick,
  } = props;
  const elements = getElements(object, mode);

  const isInTree = object.isNodeConnected() === true;

  const baseConfig = {
    className: "objectBox objectBox-node",
    "data-link-actor-id": object.id(),
  };
  let inspectIcon;
  if (isInTree) {
    if (onDOMNodeClick) {
      Object.assign(baseConfig, {
        className: `${baseConfig.className} clickable`,
        onClick: _ => onDOMNodeClick(object),
      });
    }

    if (onDOMNodeMouseOver) {
      Object.assign(baseConfig, {
        onMouseOver: _ => onDOMNodeMouseOver(object),
      });
    }

    if (onDOMNodeMouseOut) {
      Object.assign(baseConfig, {
        onMouseOut: _ => onDOMNodeMouseOut(object),
      });
    }

    if (onInspectIconClick) {
      inspectIcon = button({
        className: "open-inspector",

        onClick: e => {
          if (onDOMNodeClick) {
            e.stopPropagation();
          }

          onInspectIconClick(object, e);
        },
        // TODO: Localize this with "openNodeInInspector" when Bug 1317038 lands
        title: inspectIconTitle || "Click to select the node in the inspector",
      });
    }
  }

  return span(baseConfig, ...elements, inspectIcon);
}

function getElements(grip, mode) {
  const attributes = grip.nodeAttributeMap();
  const nodeName = grip.nodeName().toLowerCase();
  const pseudoNodeName = grip.nodePseudoType();

  const nodeNameElement = span(
    {
      className: "tag-name",
    },
    nodeName
  );

  if (pseudoNodeName) {
    return [span({ className: "attrName" }, `::${pseudoNodeName}`)];
  }

  if (mode === MODE.TINY) {
    const elements = [nodeNameElement];
    if (attributes.id) {
      elements.push(span({ className: "attrName" }, `#${attributes.id}`));
    }
    if (attributes.class) {
      elements.push(
        span(
          { className: "attrName" },
          attributes.class
            .trim()
            .split(/\s+/)
            .map(cls => `.${cls}`)
            .join("")
        )
      );
    }
    return elements;
  }

  const attributeKeys = Object.keys(attributes);
  if (attributeKeys.includes("class")) {
    attributeKeys.splice(attributeKeys.indexOf("class"), 1);
    attributeKeys.unshift("class");
  }
  if (attributeKeys.includes("id")) {
    attributeKeys.splice(attributeKeys.indexOf("id"), 1);
    attributeKeys.unshift("id");
  }
  const attributeElements = attributeKeys.reduce((arr, name, i, keys) => {
    const value = attributes[name];

    let title = isLongString(value) ? value.initial : value;
    if (title.length < MAX_ATTRIBUTE_LENGTH) {
      title = null;
    }

    const attribute = span(
      {},
      span({ className: "attrName" }, name),
      span({ className: "attrEqual" }, "="),
      StringRep({
        className: "attrValue",
        cropLimit: MAX_ATTRIBUTE_LENGTH,
        object: createPrimitiveValueFront(value),
        title,
      })
    );

    return arr.concat([" ", attribute]);
  }, []);

  return [
    span({ className: "angleBracket" }, "<"),
    nodeNameElement,
    ...attributeElements,
    span({ className: "angleBracket" }, ">"),
  ];
}

// Registration
function supportsObject(object) {
  return object?.hasPreview() && object.isNode() && object.nodeType() == nodeConstants.ELEMENT_NODE;
}

// Exports from this module
module.exports = {
  MAX_ATTRIBUTE_LENGTH,
  rep: wrapRender(ElementNode),
  supportsObject,
};
