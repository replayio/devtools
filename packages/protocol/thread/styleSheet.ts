// TODO Move this into `inspector/rules/models` as cleanup

import { StyleSheet, Object as ProtocolObject } from "@replayio/protocol";

import { assert } from "../utils";

// Manages interaction with a StyleSheet.
export class StyleSheetFront {
  private _styleSheet: StyleSheet;

  constructor(data: ProtocolObject) {
    assert(data && data.preview && data.preview.styleSheet, "no styleSheet preview");
    this._styleSheet = data.preview.styleSheet;
  }

  get href() {
    return this._styleSheet.href;
  }

  get nodeHref() {
    return this.href;
  }

  get isSystem() {
    return this._styleSheet.isSystem;
  }
}
