/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { parse } = require("properties-parser");

const bundles = {
  "devtools/client/locales/debugger.properties": parse(
    require("devtools/client/locales/en-us/debugger.properties").default
  ),
  "devtools/client/locales/webconsole.properties": parse(
    require("devtools/client/locales/en-us/webconsole.properties").default
  ),
  "devtools/client/locales/components.properties": parse(
    require("devtools/client/locales/en-us/components.properties").default
  ),
  "intl.properties": parse(require("toolkit/locales/en-US/chrome/global/intl.properties").default),
  "devtools/client/locales/inspector.properties": parse(
    require("devtools/client/locales/en-us/inspector.properties").default
  ),
  "devtools/client/locales/layout.properties": parse(
    require("devtools/client/locales/en-us/layout.properties").default
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
}
