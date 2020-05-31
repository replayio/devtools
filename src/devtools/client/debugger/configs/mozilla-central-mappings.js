/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// The excluded files below should not be required while the Debugger runs
// in Firefox. Here, "devtools/shared/flags" is used as a dummy module.
const EXCLUDED_FILES = {
  "../assets/panel/debugger.properties": "devtools/shared/flags",
  "devtools-connection": "devtools/shared/flags",
  "chrome-remote-interface": "devtools/shared/flags",
  "devtools-launchpad": "devtools/shared/flags",
};

const whatwgUrl = `
(() => { 
  importScripts("resource://devtools/client/shared/vendor/whatwg-url.js");
  return { URL }
})()
`

module.exports = Object.assign(
  {
    "./source-editor": "devtools/client/sourceeditor/editor",
    "../editor/source-editor": "devtools/client/sourceeditor/editor",
    "./test-flag": "devtools/shared/flags",
    "./fronts-device": "devtools/shared/fronts/device",
    immutable: "devtools/client/shared/vendor/immutable",
    lodash: "devtools/client/shared/vendor/lodash",
    react: "react",
    "react-dom": "react-dom",
    "react-dom-factories": "react-dom-factories",
    "react-redux": "react-redux",
    redux: "devtools/client/shared/vendor/redux",
    "prop-types": "prop-types",
    "devtools-modules/src/menu": "devtools/client/framework/menu",
    "devtools-modules/src/menu/menu-item":
      "devtools/client/framework/menu-item",
    "devtools-services": "Services",
    "wasmparser/dist/WasmParser": "devtools/client/shared/vendor/WasmParser",
    "wasmparser/dist/WasmDis": "devtools/client/shared/vendor/WasmDis",
    "whatwg-url": `var ${whatwgUrl}`,
  },
  EXCLUDED_FILES
);
