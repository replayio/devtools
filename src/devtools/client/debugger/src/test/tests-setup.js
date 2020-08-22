/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// @flow

// $FlowIgnore
global.Worker = require("workerjs");
global.loader = {};
global.loader.lazyRequireGetter = () => {};

import path from "path";
// import getConfig from "../../bin/getConfig";
import { readFileSync } from "fs";
import Enzyme from "enzyme";
// $FlowIgnore
import Adapter from "enzyme-adapter-react-16";

// import { startSourceMapWorker, stopSourceMapWorker } from "devtools-source-map";

// import {
//   start as startPrettyPrintWorker,
//   stop as stopPrettyPrintWorker,
// } from "../workers/pretty-print";

const { ParserDispatcher } = require("../workers/parser");
const { start: startSearchWorker, stop: stopSearchWorker } = require("../workers/search");
const { clearDocuments } = require("../utils/editor");
const { clearHistory } = require("./utils/history");

const env = require("devtools-environment/test-flag");

env.testing = true;

const { prefs } = require("../utils/prefs");

const { setupHelper } = require("../utils/dbg");

const rootPath = path.join(__dirname, "../../");

const { LocalizationHelper } = require("devtools/shared/l10n");

global.DebuggerConfig = {};
global.L10N = new LocalizationHelper("devtools/client/locales/debugger.properties");
global.jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;
global.performance = { now: () => 0 };

const { URL } = require("url");
global.URL = URL;

global.indexedDB = mockIndexeddDB();

Enzyme.configure({ adapter: new Adapter() });

function formatException(reason, p) {
  console && console.log("Unhandled Rejection at:", p, "reason:", reason);
}

export const parserWorker = new ParserDispatcher();
export const evaluationsParser = new ParserDispatcher();

beforeAll(() => {
  // startSourceMapWorker(path.join(rootPath, "node_modules/devtools-source-map/src/worker.js"), "");
  // startPrettyPrintWorker(path.join(rootPath, "src/workers/pretty-print/worker.js"));
  parserWorker.start(path.join(rootPath, "src/workers/parser/worker.js"));
  evaluationsParser.start(path.join(rootPath, "src/workers/parser/worker.js"));
  startSearchWorker(path.join(rootPath, "src/workers/search/worker.js"));
  process.on("unhandledRejection", formatException);
});

afterAll(() => {
  // stopSourceMapWorker();
  // stopPrettyPrintWorker();
  parserWorker.stop();
  evaluationsParser.stop();
  stopSearchWorker();
  process.removeListener("unhandledRejection", formatException);
});

afterEach(() => {});

beforeEach(async () => {
  parserWorker.clear();
  evaluationsParser.clear();
  clearHistory();
  clearDocuments();
  prefs.projectDirectoryRoot = "";
  prefs.expressions = [];

  // Ensures window.dbg is there to track telemetry
  setupHelper({ selectors: {} });
});

function mockIndexeddDB() {
  const store = {};
  return {
    open: () => ({}),
    getItem: async key => store[key],
    setItem: async (key, value) => {
      store[key] = value;
    },
  };
}

// NOTE: We polyfill finally because TRY uses node 8
if (!global.Promise.prototype.finally) {
  global.Promise.prototype.finally = function finallyPolyfill(callback) {
    const { constructor } = this;

    return this.then(
      function (value) {
        return constructor.resolve(callback()).then(function () {
          return value;
        });
      },
      function (reason) {
        return constructor.resolve(callback()).then(function () {
          throw reason;
        });
      }
    );
  };
}
