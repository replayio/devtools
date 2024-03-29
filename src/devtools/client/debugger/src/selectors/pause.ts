//
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */
import { ReplayClientInterface } from "shared/client/types";
import type { UIState } from "ui/state";
import { getPauseFrameAsync, getPauseFrameSuspense } from "ui/suspense/frameCache";

import { getSelectedFrameId } from "../reducers/pause";

export function getSelectedFrameSuspense(replayClient: ReplayClientInterface, state: UIState) {
  const selectedFrameId = getSelectedFrameId(state);
  if (!selectedFrameId) {
    return null;
  }
  return getPauseFrameSuspense(replayClient, selectedFrameId, state.sources) || null;
}

export async function getSelectedFrameAsync(replayClient: ReplayClientInterface, state: UIState) {
  const selectedFrameId = getSelectedFrameId(state);
  if (!selectedFrameId) {
    return null;
  }
  return (await getPauseFrameAsync(replayClient, selectedFrameId, state.sources)) || null;
}
