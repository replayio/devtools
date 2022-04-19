/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { getUnicodeHostname, getUnicodeUrlPath } from "devtools/client/shared/unicode-url";

import { parse } from "../url";

export function getFilenameFromURL(url) {
  const { pathname } = parse(url);
  const filename = getUnicodeUrlPath(getFilenameFromPath(pathname));
  return filename;
}

export function getFilenameFromPath(pathname) {
  let filename = "";
  if (pathname) {
    filename = pathname.substring(pathname.lastIndexOf("/") + 1);
    // This file does not have a name. Default should be (index).
    if (filename == "") {
      filename = "(index)";
    }
  }
  return filename;
}

const NoDomain = "(no domain)";
const def = { filename: "", group: "", path: "" };

export function getURL(source, defaultDomain = "") {
  const { url } = source;
  if (!url) {
    return def;
  }

  const { pathname, protocol, host } = parse(url);
  const filename = getUnicodeUrlPath(getFilenameFromPath(pathname));

  switch (protocol) {
    case "javascript:":
      // Ignore `javascript:` URLs for now
      return def;

    case "moz-extension:":
    case "resource:":
      return {
        ...def,
        filename,
        group: `${protocol}//${host || ""}`,
        path: pathname,
      };

    case "webpack:":
    case "ng:":
      return {
        ...def,
        filename,
        group: `${protocol}//`,
        path: pathname,
      };

    case "about:":
      // An about page is a special case
      return {
        ...def,
        filename,
        group: url,
        path: "/",
      };

    case "data:":
      return {
        ...def,
        filename: url,
        group: NoDomain,
        path: "/",
      };

    case "":
      if (pathname && pathname.startsWith("/")) {
        // use file protocol for a URL like "/foo/bar.js"
        return {
          ...def,
          filename,
          group: "file://",
          path: pathname,
        };
      } else if (!host) {
        return {
          ...def,
          filename,
          group: defaultDomain || "",
          path: url,
        };
      }
      break;

    case "http:":
    case "https:":
      return {
        ...def,
        filename,
        group: getUnicodeHostname(host),
        path: pathname,
      };
  }

  return {
    ...def,
    filename,
    group: protocol ? `${protocol}//` : "",
    path: pathname,
  };
}
