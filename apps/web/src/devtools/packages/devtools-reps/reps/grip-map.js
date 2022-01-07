/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// Dependencies
const PropTypes = require("prop-types");
const { span } = require("react-dom-factories");

const { lengthBubble } = require("devtools/shared/grip-length-bubble");
const { interleave, isGrip, wrapRender, ellipsisElement } = require("./rep-utils");
const PropRep = require("./prop-rep");
const { MODE } = require("./constants");
const { ModePropType } = require("./array");

/**
 * Renders an map. A map is represented by a list of its
 * entries enclosed in curly brackets.
 */
GripMap.propTypes = {
  object: PropTypes.object,
  // @TODO Change this to Object.values when supported in Node's version of V8
  mode: ModePropType,
  isInterestingEntry: PropTypes.func,
  onDOMNodeMouseOver: PropTypes.func,
  onDOMNodeMouseOut: PropTypes.func,
  onInspectIconClick: PropTypes.func,
  title: PropTypes.string,
};

function GripMap(props) {
  const { mode, object } = props;

  const config = {
    "data-link-actor-id": object.id(),
    className: "objectBox objectBox-object",
  };

  const title = getTitle(props, object);
  const isEmpty = getLength(object) === 0;

  if (isEmpty || mode === MODE.TINY) {
    return span(config, title);
  }

  const propsArray = safeEntriesIterator(props, object, maxLengthMap.get(mode));

  return span(
    config,
    title,
    span(
      {
        className: "objectLeftBrace",
      },
      " { "
    ),
    ...interleave(propsArray, ", "),
    span(
      {
        className: "objectRightBrace",
      },
      " }"
    )
  );
}

function getTitle(props, object) {
  const title = props.title || (object && object.className() ? object.className() : "Map");
  return span(
    {
      className: "objectTitle",
    },
    title,
    lengthBubble({
      object,
      mode: props.mode,
      maxLengthMap,
      getLength,
      showZeroLength: true,
    })
  );
}

function safeEntriesIterator(props, object, max) {
  max = typeof max === "undefined" ? 3 : max;
  try {
    return entriesIterator(props, object, max);
  } catch (err) {
    console.error(err);
  }
  return [];
}

function entriesIterator(props, object, max) {
  const mapEntries = object.previewContainerEntries();
  const entries = getEntries(props, mapEntries, max);
  if (entries.length < getLength(object)) {
    // There are some undisplayed entries. Then display "…".
    entries.push(ellipsisElement);
  }

  return entries;
}

/**
 * Get entries ordered by index.
 *
 * @param {Object} props Component props.
 * @param {Array} entries Entries array.
 * @param {Array} indexes Indexes of entries.
 * @return {Array} Array of PropRep.
 */
function getEntries(props, entries, max) {
  const { onDOMNodeMouseOver, onDOMNodeMouseOut, onInspectIconClick } = props;

  const rv = [];
  for (let i = 0; i < entries.length && i < max; i++) {
    const { key, value } = entries[i];
    rv.push(
      PropRep({
        name: key,
        index: i,
        equal: " \u2192 ",
        object: value,
        mode: MODE.TINY,
        onDOMNodeMouseOver,
        onDOMNodeMouseOut,
        onInspectIconClick,
      })
    );
  }
  return rv;
}

function getLength(grip) {
  return grip.containerEntryCount();
}

function supportsObject(grip) {
  if (!grip.hasPreview()) {
    return false;
  }
  return ["Map", "WeakMap"].includes(grip.className());
}

const maxLengthMap = new Map();
maxLengthMap.set(MODE.SHORT, 3);
maxLengthMap.set(MODE.LONG, 10);

// Exports from this module
module.exports = {
  rep: wrapRender(GripMap),
  supportsObject,
  maxLengthMap,
  getLength,
};
