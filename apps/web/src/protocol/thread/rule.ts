import { Rule } from "@recordreplay/protocol";
import { assert, DisallowEverythingProxyHandler } from "../utils";
import { Pause, WiredObject } from "./pause";

// Manages interaction with a CSSRule.
export class RuleFront {
  private _pause: Pause;
  private _object: WiredObject;
  private _rule: Rule;

  constructor(pause: Pause, data: WiredObject) {
    this._pause = pause;

    assert(data && data.preview && data.preview.rule);
    this._object = data;
    this._rule = data.preview.rule;
  }

  objectId() {
    return this._object.objectId;
  }

  isRule() {
    return true;
  }

  /**
   * The type of CSS rule.
   * See https://developer.mozilla.org/en-US/docs/Web/API/CSSRule#Type_constants.
   */
  get type() {
    return this._rule.type;
  }

  get cssText() {
    return this._rule.cssText;
  }

  get selectorText() {
    return this._rule.selectorText;
  }

  get selectors() {
    return this._rule.selectorText!.split(",").map(s => s.trim());
  }

  get style() {
    if (this._rule.style) {
      return this._pause.getStyleFront(this._rule.style);
    }
    return null;
  }

  get parentStyleSheet() {
    if (this._rule.parentStyleSheet) {
      return this._pause.getStyleSheetFront(this._rule.parentStyleSheet);
    }
    return null;
  }

  get href() {
    if (this._rule.originalLocation) {
      return this._rule.originalLocation.href;
    }
    return this.parentStyleSheet && this.parentStyleSheet.href;
  }

  /**
   * Whether or not the rule is an user agent style.
   */
  get isSystem() {
    return this.parentStyleSheet && this.parentStyleSheet.isSystem;
  }

  get line() {
    if (this._rule.originalLocation) {
      return this._rule.originalLocation.startLine;
    }
    return this._rule.startLine;
  }

  get column() {
    if (this._rule.originalLocation) {
      return this._rule.originalLocation.startColumn;
    }
    return this._rule.startColumn;
  }

  get mediaText() {
    // NYI
    return undefined;
  }
}

Object.setPrototypeOf(RuleFront.prototype, new Proxy({}, DisallowEverythingProxyHandler));
