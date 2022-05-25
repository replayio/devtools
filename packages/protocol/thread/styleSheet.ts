import { StyleSheet } from "@recordreplay/protocol";

import { assert, DisallowEverythingProxyHandler } from "../utils";

import { Pause, WiredObject } from "./pause";

// Manages interaction with a StyleSheet.
export class StyleSheetFront {
  private _pause: Pause;
  private _object: WiredObject;
  private _styleSheet: StyleSheet;

  constructor(pause: Pause, data: WiredObject) {
    this._pause = pause;

    assert(data && data.preview && data.preview.styleSheet, "no styleSheet preview");
    this._object = data;
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

Object.setPrototypeOf(StyleSheetFront.prototype, new Proxy({}, DisallowEverythingProxyHandler));
