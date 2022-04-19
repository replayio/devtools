/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// ReactJS
const PropTypes = require("prop-types");
const { button, span } = require("react-dom-factories");

// Reps
const { MODE } = require("./constants");
const { isGrip, cropString, wrapRender } = require("./rep-utils");

/**
 * Renders DOM #text node.
 */
TextNode.propTypes = {
  // @TODO Change this to Object.values when supported in Node's version of V8
  mode: PropTypes.oneOf(Object.keys(MODE).map(key => MODE[key])),

  object: PropTypes.object.isRequired,
  onDOMNodeMouseOut: PropTypes.func,
  onDOMNodeMouseOver: PropTypes.func,
  onInspectIconClick: PropTypes.func,
};

function TextNode(props) {
  const {
    object: grip,
    mode = MODE.SHORT,
    onDOMNodeMouseOver,
    onDOMNodeMouseOut,
    onInspectIconClick,
  } = props;

  const baseConfig = {
    className: "objectBox objectBox-textNode",
    "data-link-actor-id": grip.actor,
  };
  let inspectIcon;
  const isInTree = grip.preview && grip.preview.isConnected === true;

  if (isInTree) {
    if (onDOMNodeMouseOver) {
      Object.assign(baseConfig, {
        onMouseOver: _ => onDOMNodeMouseOver(grip),
      });
    }

    if (onDOMNodeMouseOut) {
      Object.assign(baseConfig, {
        onMouseOut: _ => onDOMNodeMouseOut(grip),
      });
    }

    if (onInspectIconClick) {
      inspectIcon = button({
        className: "open-inspector",
        draggable: false,

        onClick: e => onInspectIconClick(grip, e),
        // TODO: Localize this with "openNodeInInspector" when Bug 1317038 lands
        title: "Click to select the node in the inspector",
      });
    }
  }

  if (mode === MODE.TINY) {
    return span(baseConfig, getTitle(grip), inspectIcon);
  }

  return span(
    baseConfig,
    getTitle(grip),
    span({ className: "nodeValue" }, " ", `"${getTextContent(grip)}"`),
    inspectIcon
  );
}

function getTextContent(grip) {
  return cropString(grip._object?.preview?.node?.nodeValue || "");
}

function getTitle(grip) {
  const title = "#text";
  return span({}, title);
}

// Registration
function supportsObject(grip, noGrip = false) {
  return grip.className() == "Text";
}

// Exports from this module
module.exports = {
  rep: wrapRender(TextNode),
  supportsObject,
};
