import { StyleDeclaration } from "@recordreplay/protocol";
import { Pause, WiredObject } from "./pause";
import { assert, DisallowEverythingProxyHandler } from "../utils";

// The PageStyle actor flattens the DOM CSS objects a little bit, merging
// Rules and their Styles into one actor. For elements (which have a style
// but no associated rule) we fake a rule with the following style id.
const ELEMENT_STYLE = 100;

// Manages interaction with a CSSStyleDeclaration. StyleFront represents an inline
// element style.
export class StyleFront {
  parentStyleSheet = null;
  mediaText = undefined;
  line = undefined;
  column = undefined;
  selectors = undefined;
  href = undefined;
  isSystem = false;
  private _pause: Pause;
  private _object: WiredObject;
  private _style: StyleDeclaration;

  constructor(pause: Pause, data: WiredObject) {
    this._pause = pause;

    assert(data && data.preview && data.preview.style);
    this._object = data;
    this._style = data.preview.style;
  }

  objectId() {
    return this._object.objectId;
  }

  isRule() {
    return false;
  }

  get properties() {
    return this._style.properties;
  }

  // This stuff is here to allow code to operate on both rules and inline styles.
  get style() {
    return this;
  }

  get type() {
    return ELEMENT_STYLE;
  }

  get cssText() {
    return this._style.cssText;
  }
}

Object.setPrototypeOf(StyleFront.prototype, new Proxy({}, DisallowEverythingProxyHandler));
