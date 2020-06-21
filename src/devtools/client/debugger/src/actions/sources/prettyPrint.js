/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import assert from "../../utils/assert";
import { recordEvent } from "../../utils/telemetry";
import { remapBreakpoints } from "../breakpoints";

import { setSymbols } from "./symbols";
import { prettyPrint } from "../../workers/pretty-print";
import { getPrettySourceURL, isGenerated, isJavaScript } from "../../utils/source";
import { loadSourceText } from "./loadSourceText";
import { selectSpecificLocation } from "../sources";

import {
  getSource,
  getSourceFromId,
  getSourceByURL,
  getSelectedLocation,
  getThreadContext,
  getSourceActorsForSource,
} from "../../selectors";

import type { Action, ThunkArgs } from "../types";
import { selectSource } from "./select";
import type { Source, SourceContent, SourceActor, Context, SourceLocation } from "../../types";

const { ThreadFront } = require("protocol/thread");

/**
 * Toggle the pretty printing of a source's text. All subsequent calls to
 * |getText| will return the pretty-toggled text. Nothing will happen for
 * non-javascript files.
 *
 * @memberof actions/sources
 * @static
 * @param string id The source form from the RDP.
 * @returns Promise
 *          A promise that resolves to [aSource, prettyText] or rejects to
 *          [aSource, error].
 */
export function togglePrettyPrint(cx: Context, sourceId: string) {
  return async ({ dispatch, getState, client, sourceMaps }: ThunkArgs) => {
    const source = getSource(getState(), sourceId);
    if (!source) {
      return {};
    }

    const url = getPrettySourceURL(source.url);
    const prettySource = getSourceByURL(getState(), url);

    if (prettySource) {
      return prettySource;
    }

    const actors = getSourceActorsForSource(getState(), source.id);

    await Promise.all(actors.map(({ id }) => ThreadFront.prettyPrintScript(id)));
  };
}
