import { Object as ObjectDescription, StyleSheet } from "record-replay-protocol";
import { Pause } from "./pause";

const { assert, DisallowEverythingProxyHandler } = require("../utils");

// Manages interaction with a StyleSheet.
export class StyleSheetFront {
  private _pause: Pause;
  private _object: ObjectDescription;
  private _styleSheet: StyleSheet;

  constructor(pause: Pause, data: ObjectDescription) {
    this._pause = pause;

    assert(data && data.preview && data.preview.styleSheet);
    this._object = data;
    this._styleSheet = data.preview!.styleSheet!;
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

Object.setPrototypeOf(StyleSheetFront.prototype, new Proxy({}, DisallowEverythingProxyHandler));
