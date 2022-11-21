/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Gets a readble Unicode URL pathname from a URL pathname.
 *
 * If the `urlPath` is a readable ASCII URL pathname, such as /a/b/c.js, then
 * this function will simply return the original `urlPath`.
 *
 * If the `urlPath` is a URI-encoded pathname, such as %E8%A9%A6/%E6%B8%AC.js,
 * then this function will return the readable Unicode pathname.
 *
 * If the `urlPath` is a malformed URL pathname, then this function will simply
 * return the original `urlPath`.
 *
 * @param {string}  urlPath
 *                  the URL path from which the Unicode URL path will be parsed,
 *                  such as /a/b/c.js, %E8%A9%A6/%E6%B8%AC.js.
 * @return {string} The Unicode URL Path. It may be the same as the `urlPath`
 *                  passed to this function if the `urlPath` itself is a readable
 *                  ASCII url or a Unicode url.
 */
export function getUnicodeUrlPath(urlPath: string) {
  try {
    return decodeURIComponent(urlPath);
  } catch (err) {}
  return urlPath;
}

/**
 * Gets a readable Unicode URL from a URL.
 *
 * If the `url` is a readable ASCII URL, such as http://example.org/a/b/c.js,
 * then this function will simply return the original `url`.
 *
 * If the `url` includes either an unreadable Punycode domain name or an
 * unreadable URI-encoded pathname, such as
 * http://xn--g6w.xn--8pv/%E8%A9%A6/%E6%B8%AC.js, then this function will return
 * the readable URL by decoding all its unreadable URL components to Unicode
 * characters. The character `#` is not decoded from escape sequences.
 *
 * If the `url` is a malformed URL, then this function will return the original
 * `url`.
 *
 * If the `url` is a data: URI, then this function will return the original
 * `url`.
 *
 * @param {string}  url
 *                  the full URL, or a data: URI. from which the readable URL
 *                  will be parsed, such as, http://example.org/a/b/c.js,
 *                  http://xn--g6w.xn--8pv/%E8%A9%A6/%E6%B8%AC.js
 * @return {string} The readable URL. It may be the same as the `url` passed to
 *                  this function if the `url` itself is readable.
 */
export function getUnicodeUrl(url: string) {
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol === "data:") {
      // Never convert a data: URI.
      return url;
    }
    const readableHostname = hostname;
    url = decodeURI(url);
    return url.replace(hostname, readableHostname);
  } catch (err) {}
  return url;
}
