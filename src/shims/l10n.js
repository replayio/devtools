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
  "intl.properties": parse(require("toolkit/locales/en-US/chrome/global/intl.properties").default),
  "devtools/client/locales/inspector.properties": parse(
    require("devtools/client/locales/en-us/inspector.properties").default
  ),
  "devtools/client/locales/layout.properties": parse(
    require("devtools/client/locales/en-us/layout.properties").default
  ),
  "devtools/client/locales/boxmodel.properties": parse(
    require("devtools/client/locales/en-us/boxmodel.properties").default
  ),
  "devtools/client/locales/shared.properties": parse(
    require("devtools/client/locales/en-us/shared.properties").default
  ),
  "devtools/shared/locales/styleinspector.properties": parse(
    require("devtools/shared/locales/en-US/styleinspector.properties").default
  ),
  "devtools/client/locales/accessibility.properties": parse(
    require("devtools/client/locales/en-us/accessibility.properties").default
  ),
  "devtools/shared/locales/accessibility.properties": parse(
    require("devtools/shared/locales/en-US/accessibility.properties").default
  ),
};

const defaultStrings = { ...bundles["intl.properties"] };

export class LocalizationHelper {
  constructor(...paths) {
    this.paths = paths;

    this.strings = { ...defaultStrings };
    for (const path of paths) {
      Object.assign(this.strings, bundles[path]);
    }
  }

  getStr(key) {
    if (!this.strings[key]) {
      throw new Error(`L10N key ${key} cannot be found.`);
    }
    return this.strings[key];
  }

  getFormatStr(name, ...args) {
    return sprintf(this.getStr(name), ...args);
  }

  numberWithDecimals(number, decimals = 0) {
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
