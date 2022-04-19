/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// ReactJS
const PropTypes = require("prop-types");
const { span } = require("react-dom-factories");

// Dependencies
const { MODE } = require("./constants");
const PropRep = require("./prop-rep");
const { getGripType, isGrip, wrapRender } = require("./rep-utils");

/**
 * Renders a DOM Promise object.
 */
PromiseRep.propTypes = {
  // @TODO Change this to Object.values when supported in Node's version of V8
  mode: PropTypes.oneOf(Object.keys(MODE).map(key => MODE[key])),

  object: PropTypes.object.isRequired,
  onDOMNodeMouseOut: PropTypes.func,
  onDOMNodeMouseOver: PropTypes.func,
  onInspectIconClick: PropTypes.func,
};

function PromiseRep(props) {
  const object = props.object;
  const { promiseState } = object;

  const config = {
    className: "objectBox objectBox-object",
    "data-link-actor-id": object.actor,
  };

  if (props.mode === MODE.TINY) {
    const { Rep } = require("./rep");

    return span(
      config,
      getTitle(object),
      span(
        {
          className: "objectLeftBrace",
        },
        " { "
      ),
      Rep({ object: promiseState.state }),
      span(
        {
          className: "objectRightBrace",
        },
        " }"
      )
    );
  }

  const propsArray = getProps(props, promiseState);
  return span(
    config,
    getTitle(object),
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

function getTitle(object) {
  return span(
    {
      className: "objectTitle",
    },
    object.class
  );
}

function getProps(props, promiseState) {
  const keys = ["state"];
  if (Object.keys(promiseState).includes("value")) {
    keys.push("value");
  }

  return keys.reduce((res, key, i) => {
    const object = promiseState[key];
    res = res.concat(
      PropRep({
        ...props,
        equal: ": ",
        mode: MODE.TINY,
        name: `<${key}>`,
        object: object.getGrip ? object.getGrip() : object,
        suppressQuotes: true,
      })
    );

    // Interleave commas between elements
    if (i !== keys.length - 1) {
      res.push(", ");
    }

    return res;
  }, []);
}

// Registration
function supportsObject(object) {
  return object.className() == "Promise";
}

// Exports from this module
module.exports = {
  rep: wrapRender(PromiseRep),
  supportsObject,
};
