/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import memoize from "lodash/memoize";

const defaultUrl = {
  hash: "",
  host: "",
  hostname: "",
  href: "",
  origin: "null",
  password: "",
  path: "",
  pathname: "",
  port: "",
  protocol: "",
  search: "",
  // This should be a "URLSearchParams" object
  searchParams: {},
  username: "",
};

export const parse = memoize(function parse(url) {
  try {
    const urlObj = new URL(url);
    urlObj.path = urlObj.pathname + urlObj.search;
    return urlObj;
  } catch (err) {
    // If we're given simply a filename...
    if (url) {
      return { ...defaultUrl, path: url, pathname: url };
    }

    return defaultUrl;
  }
});

export function sameOrigin(firstUrl, secondUrl) {
  return parse(firstUrl).origin == parse(secondUrl).origin;
}
