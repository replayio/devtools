/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// ReactJS
const PropTypes = require("prop-types");
const { span } = require("react-dom-factories");

// Reps
const { MODE } = require("./constants");
const { rep } = require("./grip");
const PropRep = require("./prop-rep");
const { isGrip, wrapRender } = require("./rep-utils");

/**
 * Renders DOM event objects.
 */
Event.propTypes = {
  // @TODO Change this to Object.values when supported in Node's version of V8
  mode: PropTypes.oneOf(Object.keys(MODE).map(key => MODE[key])),

  object: PropTypes.object.isRequired,
  onDOMNodeMouseOut: PropTypes.func,
  onDOMNodeMouseOver: PropTypes.func,
  onInspectIconClick: PropTypes.func,
};

function Event(props) {
  const propsArray = getProperties(props);

  if (props.mode === MODE.TINY) {
    const tinyModeItems = [];
    tinyModeItems.push(getTitleElement(props));
    return span({ className: "objectBox objectBox-object" }, ...tinyModeItems);
  }

  return span(
    { className: "objectBox objectBox-object" },
    getTitleElement(props),
    span(
      {
        className: "objectLeftBrace",
      },
      " { "
    ),
    ...propsArray,
    span(
      {
        className: "objectRightBrace",
      },
      " }"
    )
  );
}

function getProperties(props) {
  let propertyNames;
  switch (props.object.className()) {
    case "MouseEvent":
      propertyNames = ["target", "clientX", "clientY", "layerX", "layerY"];
      break;
    case "KeyboardEvent":
      propertyNames = ["target", "key", "charCode", "keyCode"];
      break;
    case "MessageEvent":
      propertyNames = ["target", "isTrusted", "data"];
  }

  const elements = [];
  const preview = props.object.previewValueMap();

  propertyNames.forEach((name, i) => {
    if (preview.get(name)) {
      elements.push(
        PropRep({
          ...props,
          equal: ": ",
          key: name,
          mode: MODE.TINY,
          name,
          object: preview.get(name),
        })
      );
    }

    if (i + 1 < propertyNames.length) {
      elements.push(", ");
    }
  });

  return elements;
}

function getKeyboardEventModifiers(preview) {
  const keysToModifiersMap = {
    altKey: "Alt",
    ctrlKey: "Control",
    metaKey: "Meta",
    shiftKey: "Shift",
  };

  const modifiers = [];
  for (const [property, name] of Object.entries(keysToModifiersMap)) {
    if (preview.get(property).primitive()) {
      modifiers.push(name);
    }
  }
  return modifiers;
}

function getTitle(props) {
  const preview = props.object.previewValueMap();
  let title = preview.get("type").primitive();

  if (props.object.className() == "KeyboardEvent") {
    const modifiers = getKeyboardEventModifiers(preview);
    if (modifiers.length) {
      title = `${title} ${modifiers.join("-")}`;
    }
  }
  return title;
}

function getTitleElement(props) {
  return span({ className: "objectTitle" }, getTitle(props));
}

// Registration
function supportsObject(object) {
  return ["MouseEvent", "KeyboardEvent", "MessageEvent"].includes(object.className());
}

// Exports from this module
module.exports = {
  rep: wrapRender(Event),
  supportsObject,
};
