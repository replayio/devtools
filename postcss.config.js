/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

var mapUrl = require("postcss-url-mapper");
const debug = require("debug")("postcss");

function mapUrlDevelopment(url) {
  const newUrl = url
    .replace(/resource:\/\//, "/src/")
    .replace(/(chrome:\/\/)/, "/src/")
    .replace(/devtools\/skin/, "devtools/client/themes")
    .replace(/devtools\/content/, "devtools/client");

  debug("map url", { url, newUrl });
  return newUrl;
}

module.exports = {
  plugins: [
    "tailwindcss",
    [
      "autoprefixer",
      {
        flexbox: false,
        grid: false,
      },
    ],
    // mapUrl(mapUrlDevelopment),
  ],
};
