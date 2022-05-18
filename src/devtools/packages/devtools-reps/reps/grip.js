/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// ReactJS
const PropTypes = require("prop-types");
const { span } = require("react-dom-factories");

// Dependencies
const { interleave, isGrip, wrapRender } = require("./rep-utils");
const PropRep = require("./prop-rep");
const { MODE } = require("./constants");

/**
 * Renders generic grip. Grip is client representation
 * of remote JS object and is used as an input object
 * for this rep component.
 */
GripRep.propTypes = {
  object: PropTypes.object.isRequired,
  // @TODO Change this to Object.values when supported in Node's version of V8
  mode: PropTypes.oneOf(Object.keys(MODE).map(key => MODE[key])),
  isInterestingProp: PropTypes.func,
  title: PropTypes.string,
  onDOMNodeMouseOver: PropTypes.func,
  onDOMNodeMouseOut: PropTypes.func,
  onInspectIconClick: PropTypes.func,
  noGrip: PropTypes.bool,
};

const DEFAULT_TITLE = "Object";

function GripRep(props) {
  const { mode = MODE.SHORT, object } = props;

  const config = {
    "data-link-actor-id": object.id(),
    className: "objectBox objectBox-object",
  };

  if (mode === MODE.TINY) {
    const hasProperties = !object.hasPreview() || object.previewValueCount() != 0;

    const tinyModeItems = [];
    if (getTitle(props, object) !== DEFAULT_TITLE) {
      tinyModeItems.push(getTitleElement(props, object));
    } else {
      tinyModeItems.push(
        span(
          {
            className: "objectLeftBrace",
          },
          "{"
        ),
        hasProperties
          ? span(
              {
                key: "more",
                className: "more-ellipsis",
                title: "more…",
              },
              "…"
            )
          : null,
        span(
          {
            className: "objectRightBrace",
          },
          "}"
        )
      );
    }

    return span(config, ...tinyModeItems);
  }

  const propsArray = safePropIterator(props, object, maxLengthMap.get(mode));

  return span(
    config,
    getTitleElement(props, object),
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

function getTitleElement(props, object) {
  return span(
    {
      className: "objectTitle",
    },
    getTitle(props, object)
  );
}

function getTitle(props, object) {
  return props.title || object.originalClassName || object.className() || DEFAULT_TITLE;
}

function safePropIterator(props, object, max) {
  max = typeof max === "undefined" ? maxLengthMap.get(MODE.SHORT) : max;
  try {
    return propIterator(props, object, max);
  } catch (err) {
    console.error(err);
  }
  return [];
}

function propIterator(props, object, max) {
  /*
  if (object.preview && Object.keys(object.preview).includes("wrappedValue")) {
    const { Rep } = require("./rep");

    return [
      Rep({
        object: object.preview.wrappedValue,
        mode: props.mode || MODE.TINY,
        defaultRep: Grip,
      }),
    ];
  }

  // Property filter. Show only interesting properties to the user.
  */
  const isInterestingProp =
    props.isInterestingProp ||
    ((type, value) => {
      return (
        type == "boolean" || type == "number" || (type == "string" && value.primitive().length != 0)
      );
    });

  const properties = object.previewValueMap();
  const propertiesLength = object.previewValueCount();
  let indexes = getPropIndexes(properties, max, isInterestingProp);
  if (indexes.length < max && indexes.length < propertiesLength) {
    // There are not enough props yet.
    // Then add uninteresting props to display them.
    indexes = indexes.concat(
      getPropIndexes(properties, max - indexes.length, (t, value, name) => {
        return !isInterestingProp(t, value, name);
      })
    );
  }

  // The server synthesizes some property names for a Proxy, like
  // <target> and <handler>; we don't want to quote these because,
  // as synthetic properties, they appear more natural when
  // unquoted.
  const suppressQuotes = object.className() === "Proxy";
  const propsArray = getProps(props, properties, indexes, suppressQuotes);

  // Show symbols.
  /*
  if (object.preview && object.preview.ownSymbols) {
    const { ownSymbols } = object.preview;
    const length = max - indexes.length;
  
    const symbolsProps = ownSymbols.slice(0, length).map(symbolItem => {
      const symbolValue = symbolItem.descriptor.value;
      const symbolGrip =
        symbolValue && symbolValue.getGrip
          ? symbolValue.getGrip()
          : symbolValue;
  
      return PropRep({
        ...props,
        mode: MODE.TINY,
        name: symbolItem,
        object: symbolGrip,
        equal: ": ",
        defaultRep: Grip,
        title: null,
        suppressQuotes,
      });
    });
  
    propsArray.push(...symbolsProps);
  }
    */

  if (propertiesLength > propsArray.length || object.hasPreviewOverflow()) {
    // There are some undisplayed props. Then display "more...".
    propsArray.push(
      span(
        {
          key: "more",
          className: "more-ellipsis",
          title: "more…",
        },
        "…"
      )
    );
  }

  return propsArray;
}

/**
 * Get props ordered by index.
 *
 * @param {Object} componentProps Grip Component props.
 * @param {Object} properties Properties of the object the Grip describes.
 * @param {Array} indexes Indexes of properties.
 * @param {Boolean} suppressQuotes true if we should suppress quotes
 *                  on property names.
 * @return {Array} Props.
 */
function getProps(componentProps, properties, indexes, suppressQuotes) {
  // Make indexes ordered by ascending.
  indexes.sort(function (a, b) {
    return a - b;
  });

  const propertiesKeys = [...properties.keys()];
  return indexes.map(i => {
    const name = propertiesKeys[i];
    const value = properties.get(name);

    return PropRep({
      ...componentProps,
      mode: MODE.TINY,
      name,
      object: value,
      equal: ": ",
      index: i,
      defaultRep: Grip,
      title: null,
      suppressQuotes,
    });
  });
}

/**
 * Get the indexes of props in the object.
 *
 * @param {Object} properties Props object.
 * @param {Number} max The maximum length of indexes array.
 * @param {Function} filter Filter the props you want.
 * @return {Array} Indexes of interesting props in the object.
 */
function getPropIndexes(properties, max, filter) {
  const indexes = [];

  try {
    let i = 0;
    for (const name of properties.keys()) {
      if (indexes.length >= max) {
        return indexes;
      }

      // Type is specified in grip's "class" field and for primitive
      // values use typeof.
      const value = properties.get(name);
      let type = value.isObject() ? value.className() : typeof value.primitive();
      type = type.toLowerCase();

      if (filter(type, value, name)) {
        indexes.push(i);
      }
      i++;
    }
  } catch (err) {
    console.error(err);
  }
  return indexes;
}

// Registration
function supportsObject(object, noGrip = false) {
  return true;
}

const maxLengthMap = new Map();
maxLengthMap.set(MODE.SHORT, 3);
maxLengthMap.set(MODE.LONG, 10);

// Grip is used in propIterator and has to be defined here.
const Grip = {
  rep: wrapRender(GripRep),
  supportsObject,
  maxLengthMap,
};

// Exports from this module
module.exports = Grip;
