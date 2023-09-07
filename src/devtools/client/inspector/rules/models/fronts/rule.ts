import { Object as ProtocolObject, Rule } from "@replayio/protocol";
import QuickLRU from "shared/utils/quick-lru";

import { assert } from "protocol/utils";
import { getCachedObject } from "replay-next/src/suspense/ObjectPreviews";

import { StyleFront } from "./style";
import { StyleSheetFront } from "./styleSheet";

const cachedSelectorStrings = new QuickLRU<string, string[]>({
  maxSize: 3000,
});
const cachedSelectorText = new QuickLRU<string, string>({
  maxSize: 3000,
});

// Manages interaction with a CSSRule.
export class RuleFront {
  private pauseId: string;
  private _object: ProtocolObject;
  private _rule: Rule;
  private _styleFront: StyleFront | null = null;
  private _styleSheetFront: StyleSheetFront | null = null;

  constructor(pauseId: string, data: ProtocolObject) {
    this.pauseId = pauseId;
    assert(data && data.preview && data.preview.rule, "no rule preview");
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

  get cleanedSelectorText() {
    if (cachedSelectorText.has(this._rule.selectorText!)) {
      return cachedSelectorText.get(this._rule.selectorText!)!;
    }

    const selectorText = this.selectors.join(", ");
    cachedSelectorText.set(this._rule.selectorText!, selectorText);
    return selectorText;
  }

  get selectors() {
    if (cachedSelectorStrings.has(this._rule.selectorText!)) {
      return cachedSelectorStrings.get(this._rule.selectorText!)!;
    }

    const selectors = this._rule.selectorText!.split(",").map(s => s.trim());
    cachedSelectorStrings.set(this._rule.selectorText!, selectors);
    return selectors;
  }

  get style() {
    if (this._rule.style) {
      if (!this._styleFront) {
        // `ElementStyle` makes sure this data is cached already
        this._styleFront = new StyleFront(getCachedObject(this.pauseId, this._rule.style!)!);
      }
      return this._styleFront;
    }
    return null;
  }

  get parentStyleSheet() {
    if (this._rule.parentStyleSheet) {
      if (!this._styleSheetFront) {
        this._styleSheetFront = new StyleSheetFront(
          getCachedObject(this.pauseId, this._rule.parentStyleSheet!)!
        );
      }
      return this._styleSheetFront;
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
