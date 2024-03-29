/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import { isDevelopment } from "shared/utils/environment";

export default function assert(condition, message) {
  if (isDevelopment() && !condition) {
    throw new Error(`Assertion failure: ${message}`);
  }
}
