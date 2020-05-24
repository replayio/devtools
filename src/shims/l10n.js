/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { sprintf } = require("devtools-sprintf-js");
const { parse } = require("properties-parser");

const bundles = {
  "devtools/client/locales/toolbox.properties": parse(
    require("devtools/client/locales/en-us/toolbox.properties").default
  ),
  "devtools/client/locales/debugger.properties": parse(
    require("devtools/client/locales/en-us/debugger.properties").default
  ),
  "devtools/client/locales/webconsole.properties": parse(
    require("devtools/client/locales/en-us/webconsole.properties").default
  ),
  "devtools/client/locales/components.properties": parse(
    require("devtools/client/locales/en-us/components.properties").default
  ),
  "devtools/client/locales/sourceeditor.properties": parse(
    require("devtools/client/locales/en-us/sourceeditor.properties").default
  ),
  "intl.properties": parse(
    require("toolkit/locales/en-US/chrome/global/intl.properties").default
  ),
  "devtools/client/locales/font-inspector.properties": parse(
    require("devtools/client/locales/en-US/font-inspector.properties").default
  ),
  "devtools/client/locales/inspector.properties": parse(
    require("devtools/client/locales/en-US/inspector.properties").default
  ),
  "devtools/client/locales/layout.properties": parse(
    require("devtools/client/locales/en-US/layout.properties").default
  ),
  "devtools/client/locales/boxmodel.properties": parse(
    require("devtools/client/locales/en-US/boxmodel.properties").default
  ),
  "devtools/client/locales/shared.properties": parse(
    require("devtools/client/locales/en-US/shared.properties").default
  ),
};

const defaultStrings = { ...bundles["intl.properties"] };

export class LocalizationHelper {
  constructor(path) {
    this.path = path;

    this.strings = { ...defaultStrings, ...bundles[path] };
  }

  getStr(key: string) {
    if (!this.strings[key]) {
      throw new Error(`L10N key ${key} cannot be found.`);
    }
    return this.strings[key];
  }

  getFormatStr(name: string, ...args: any) {
    return sprintf(this.getStr(name), ...args);
  }

  numberWithDecimals(number: number, decimals: number = 0) {
    // If this is an integer, don't do anything special.
    if (number === (number | 0)) {
      return number;
    }
    // If this isn't a number (and yes, `isNaN(null)` is false), return zero.
    if (isNaN(number) || number === null) {
      return "0";
    }

    let localized = number.toLocaleString();

    // If no grouping or decimal separators are available, bail out, because
    // padding with zeros at the end of the string won't make sense anymore.
    if (!localized.match(/[^\d]/)) {
      return localized;
    }

    return number.toLocaleString(undefined, {
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
    });
  }
}
