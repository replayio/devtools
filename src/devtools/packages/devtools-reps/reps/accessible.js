/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// ReactJS
const PropTypes = require("prop-types");
const { button, span } = require("react-dom-factories");

// Utils
const { isGrip, wrapRender } = require("./rep-utils");
const { rep: StringRep } = require("./string");

/**
 * Renders Accessible object.
 */
Accessible.propTypes = {
  inspectIconTitle: PropTypes.string,
  nameMaxLength: PropTypes.number,
  object: PropTypes.object.isRequired,
  onAccessibleClick: PropTypes.func,
  onAccessibleMouseOut: PropTypes.func,
  onAccessibleMouseOver: PropTypes.func,
  onInspectIconClick: PropTypes.func,
  roleFirst: PropTypes.bool,
  separatorText: PropTypes.string,
};

function Accessible(props) {
  const {
    object,
    inspectIconTitle,
    nameMaxLength,
    onAccessibleClick,
    onAccessibleMouseOver,
    onAccessibleMouseOut,
    onInspectIconClick,
    roleFirst,
    separatorText,
  } = props;
  const elements = getElements(object, nameMaxLength, roleFirst, separatorText);
  const isInTree = object.preview && object.preview.isConnected === true;
  const baseConfig = {
    className: "objectBox objectBox-accessible",
    "data-link-actor-id": object.actor,
  };

  let inspectIcon;
  if (isInTree) {
    if (onAccessibleClick) {
      Object.assign(baseConfig, {
        className: `${baseConfig.className} clickable`,
        onClick: _ => onAccessibleClick(object),
      });
    }

    if (onAccessibleMouseOver) {
      Object.assign(baseConfig, {
        onMouseOver: _ => onAccessibleMouseOver(object),
      });
    }

    if (onAccessibleMouseOut) {
      Object.assign(baseConfig, {
        onMouseOut: onAccessibleMouseOut,
      });
    }

    if (onInspectIconClick) {
      inspectIcon = button({
        className: "open-accessibility-inspector",
        onClick: e => {
          if (onAccessibleClick) {
            e.stopPropagation();
          }

          onInspectIconClick(object, e);
        },
        title: inspectIconTitle,
      });
    }
  }

  return span(baseConfig, ...elements, inspectIcon);
}

function getElements(grip, nameMaxLength, roleFirst = false, separatorText = ": ") {
  const { name, role } = grip.preview;
  const elements = [];
  if (name) {
    elements.push(
      StringRep({
        className: "accessible-name",
        cropLimit: nameMaxLength,
        object: name,
      }),
      span({ className: "separator" }, separatorText)
    );
  }

  elements.push(span({ className: "accessible-role" }, role));
  return roleFirst ? elements.reverse() : elements;
}

// Registration
function supportsObject(object, noGrip = false) {
  return false;
  // return object.preview && object.typeName && object.typeName === "accessible";
}

// Exports from this module
module.exports = {
  rep: wrapRender(Accessible),
  supportsObject,
};
