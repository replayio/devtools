/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { UIState } from "ui/state";
import { setLogpoint, setLogpointByURL, newLogGroupId, removeLogpoint } from "ui/actions/logpoint";
import type { ThreadFront as TF } from "protocol/thread";
import { assert } from "protocol/utils";

import type { BreakpointOptions, SourceLocation } from "../../reducers/types";
import { getCorrespondingSourceIds, getSourceToDisplayForUrl } from "ui/reducers/sources";

export type InitialBreakpointOptions = Pick<
  BreakpointOptions,
  "condition" | "shouldPause" | "logValue"
>;
type FinalBreakpointOptions = Pick<
  BreakpointOptions,
  "condition" | "shouldPause" | "logValue" | "logGroupId"
>;

interface BreakpointDetails {
  location: SourceLocation;
  options: FinalBreakpointOptions;
}

let breakpoints: Record<string, BreakpointDetails> = {};

// Get the string key to use for a breakpoint location.
// See also duplicate code in breakpoint-actor-map.js :(
function locationKey(location: SourceLocation) {
  const { sourceUrl, line, column } = location;
  const sourceId = location.sourceId || "";
  // $FlowIgnore
  return `${sourceUrl}:${sourceId}:${line}:${column}`;
}

function maybeGenerateLogGroupId(options: InitialBreakpointOptions): FinalBreakpointOptions {
  if (options.logValue) {
    return { ...options, logGroupId: newLogGroupId() };
  }
  return options;
}

async function maybeClearLogpoint(location: SourceLocation) {
  const bp = breakpoints[locationKey(location)];
  if (bp && bp.options.logGroupId) {
    removeLogpoint(bp.options.logGroupId);
  }
}

export async function _internalSetBreakpoint(
  ThreadFront: typeof TF,
  state: UIState,
  location: SourceLocation,
  options: InitialBreakpointOptions
) {
  maybeClearLogpoint(location);
  const finalOptions = maybeGenerateLogGroupId(options);
  breakpoints[locationKey(location)] = { location, options: finalOptions };

  const { condition, logValue, logGroupId, shouldPause } = finalOptions;
  const { line, column, sourceUrl, sourceId } = location;
  const promises = [];

  if (sourceId) {
    if (shouldPause) {
      const correspondingSourceIds = getCorrespondingSourceIds(state, sourceId);
      for (const correspondingSourceId of correspondingSourceIds) {
        promises.push(ThreadFront.setBreakpoint(correspondingSourceId, line, column!, condition!));
      }
    }
    if (logValue) {
      promises.push(
        setLogpoint(logGroupId!, { sourceId, line, column: column! }, logValue, condition!)
      );
    }
  } else {
    if (shouldPause) {
      assert(sourceUrl, "a breakpoint without a sourceId must have a sourceUrl");
      const source = getSourceToDisplayForUrl(state, sourceUrl);
      assert(source, `no source found for ${sourceUrl}`);
      const correspondingSourceIds = getCorrespondingSourceIds(state, source.id);
      for (const correspondingSourceId of correspondingSourceIds) {
        promises.push(ThreadFront.setBreakpoint(correspondingSourceId, line, column!, condition!));
      }
    }
    if (logValue) {
      promises.push(
        setLogpointByURL(logGroupId!, sourceUrl!, line, column!, logValue, condition!, state)
      );
    }
  }

  await Promise.all(promises);
}

export async function _internalRemoveBreakpoint(
  ThreadFront: typeof TF,
  state: UIState,
  location: SourceLocation
) {
  maybeClearLogpoint(location);
  delete breakpoints[locationKey(location)];

  const { line, column, sourceUrl, sourceId } = location;

  if (sourceId) {
    const correspondingSourceIds = getCorrespondingSourceIds(state, sourceId);
    return await Promise.all(
      correspondingSourceIds.map(correspondingSourceId =>
        ThreadFront.removeBreakpoint(correspondingSourceId, line, column!)
      )
    );
  }

  assert(sourceUrl, "a breakpoint without a sourceId must have a sourceUrl");
  const source = getSourceToDisplayForUrl(state, sourceUrl);
  assert(source, `no source found for ${sourceUrl}`);
  const correspondingSourceIds = getCorrespondingSourceIds(state, source.id);
  await Promise.all(
    correspondingSourceIds.map(correspondingSourceId =>
      ThreadFront.removeBreakpoint(correspondingSourceId, line, column!)
    )
  );
}
