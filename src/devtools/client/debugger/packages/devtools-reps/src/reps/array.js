/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// Dependencies
const { span } = require("react-dom-factories");
const PropTypes = require("prop-types");
const { wrapRender } = require("./rep-utils");
const { MODE } = require("./constants");

const { createPrimitiveValueFront } = require("protocol/thread");

const ModePropType = PropTypes.oneOf(
  // @TODO Change this to Object.values when supported in Node's version of V8
  Object.keys(MODE).map(key => MODE[key])
);

/**
 * Renders an array. The array is enclosed by left and right bracket
 * and the max number of rendered items depends on the current mode.
 */
ArrayRep.propTypes = {
  mode: ModePropType,
  object: PropTypes.array.isRequired,
};

function ArrayRep(props) {
  const { object, mode = MODE.SHORT } = props;

  let items;
  let brackets;
  const needSpace = function (space) {
    return space ? { left: "[ ", right: " ]" } : { left: "[", right: "]" };
  };

  if (mode === MODE.TINY) {
    items = [
      span(
        {
          className: "more-ellipsis",
          title: "more…",
        },
        "…"
      ),
    ];
    brackets = needSpace(false);
  } else {
    items = arrayIterator(props, object, maxLengthMap.get(mode));
    brackets = needSpace(items.length > 0);
  }

  return span(
    {
      className: "objectBox objectBox-array",
    },
    getTitle(props, object),
    span(
      {
        className: "arrayLeftBracket",
      },
      brackets.left
    ),
    ...items,
    span(
      {
        className: "arrayRightBracket",
      },
      brackets.right
    )
  );
}

function getArrayLikeLength(object) {
  if (["Set", "WeakSet"].includes(object.className())) {
    return object.containerEntryCount();
  }
  const propertyValues = object.previewValueMap();
  return propertyValues.length.primitive();
}

function getTitle(props, object) {
  const name = object.className();
  const length = getArrayLikeLength(object);

  return span(
    {
      className: "objectTitle",
    },
    name,
    "(",
    length,
    ") "
  );
}

function arrayIterator(props, array, max) {
  const items = [];
  const length = getArrayLikeLength(array);
  const propertyValues = array.previewValueMap();

  let containerEntries;
  if (["Set", "WeakSet"].includes(array.className())) {
    containerEntries = array.previewContainerEntries();
  }

  for (let i = 0; i < length && i < max; i++) {
    const config = {
      mode: MODE.TINY,
      delim: i == length - 1 ? "" : ", ",
    };
    let elem;
    if (containerEntries && i < containerEntries.length) {
      elem = containerEntries[i].value;
    } else {
      elem = propertyValues[i];
    }
    if (!elem) {
      elem = createPrimitiveValueFront(null);
    }
    const item = ItemRep({
      ...props,
      ...config,
      object: elem,
    });
    items.push(item);
  }

  if (length > max) {
    items.push(
      span(
        {
          className: "more-ellipsis",
          title: "more…",
        },
        "…"
      )
    );
  }

  return items;
}

/**
 * Renders array item. Individual values are separated by a comma.
 */
ItemRep.propTypes = {
  object: PropTypes.any.isRequired,
  delim: PropTypes.string.isRequired,
  mode: ModePropType,
};

function ItemRep(props) {
  const { Rep } = require("./rep");

  const { object, delim, mode } = props;
  return span(
    {},
    Rep({
      ...props,
      object: object,
      mode: mode,
    }),
    delim
  );
}

function getLength(object) {
  return object.length;
}

function supportsObject(object) {
  if (!object.hasPreview()) {
    return false;
  }
  const classNames = [
    "Array",
    "Arguments",
    "Set",
    "WeakSet",
    "Int8Array",
    "Uint8Array",
    "Uint8ClampedArray",
    "Int16Array",
    "Uint16Array",
    "Int32Array",
    "Uint32Array",
    "Float32Array",
    "Float64Array",
    "BigInt64Array",
    "BigUint64Array",
  ];
  return classNames.includes(object.className());
}

const maxLengthMap = new Map();
maxLengthMap.set(MODE.SHORT, 3);
maxLengthMap.set(MODE.LONG, 10);

// Exports from this module
module.exports = {
  rep: wrapRender(ArrayRep),
  supportsObject,
  maxLengthMap,
  getLength,
  ModePropType,
};
