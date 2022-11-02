import { Object as ProtocolObject, StyleDeclaration } from "@replayio/protocol";

import { assert } from "protocol/utils";
import { ELEMENT_STYLE } from "shared/constants";

// Manages interaction with a CSSStyleDeclaration.
// StyleFront represents an inline element style.
export class StyleFront {
  parentStyleSheet = null;
  mediaText = undefined;
  line = undefined;
  column = undefined;
  selectors = undefined;
  href = undefined;
  isSystem = false;
  private _object: ProtocolObject;
  private _style: StyleDeclaration;

  constructor(data: ProtocolObject) {
    assert(data && data.preview && data.preview.style, "no style preview");
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
