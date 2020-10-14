const { assert, DisallowEverythingProxyHandler } = require("../utils");
const { ELEMENT_STYLE } = require("devtools/client/inspector/rules/constants");

// Manages interaction with a CSSStyleDeclaration. StyleFront represents an inline
// element style.
export function StyleFront(pause, data) {
  this._pause = pause;

  assert(data && data.preview && data.preview.style);
  this._object = data;
  this._style = data.preview.style;
}

StyleFront.prototype = {
  objectId() {
    return this._object.objectId;
  },

  isRule() {
    return false;
  },

  get properties() {
    return this._style.properties;
  },

  // This stuff is here to allow code to operate on both rules and inline styles.
  get style() {
    return this;
  },

  get type() {
    return ELEMENT_STYLE;
  },

  parentStyleSheet: null,
  mediaText: undefined,
  line: undefined,
  column: undefined,
  selectors: undefined,
  href: undefined,
  isSystem: false,
};

Object.setPrototypeOf(StyleFront.prototype, new Proxy({}, DisallowEverythingProxyHandler));
