/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import type { PauseFrame } from "devtools/client/debugger/src/reducers/pause";

// eslint-disable-next-line max-len
import { getFrameUrl } from "./getFrameUrl";

function collapseLastFrames(frames: PauseFrame[]) {
  const index = frames.findIndex(frame => getFrameUrl(frame).match(/webpack\/bootstrap/i));

  if (index == -1) {
    return { newFrames: frames, lastGroup: [] };
  }

  const newFrames = frames.slice(0, index);
  const lastGroup = frames.slice(index);
  return { newFrames, lastGroup };
}

export function collapseFrames(frames: PauseFrame[]) {
  // We collapse groups of one so that user frames
  // are not in a group of one
  function addGroupToList(group: PauseFrame[] | null, list: (PauseFrame | PauseFrame[])[]) {
    if (!group) {
      return list;
    }

    if (group.length > 1) {
      list.push(group);
    } else {
      list = list.concat(group);
    }

    return list;
  }

  const { newFrames, lastGroup } = collapseLastFrames(frames);
  frames = newFrames;
  let items: (PauseFrame | PauseFrame[])[] = [];
  let currentGroup = null;
  let prev = null;
  for (const frame of frames) {
    if (!currentGroup) {
      currentGroup = [frame];
    } else if (prev?.library && prev?.library == frame.library) {
      currentGroup.push(frame);
    } else {
      items = addGroupToList(currentGroup, items);
      currentGroup = [frame];
    }

    prev = frame;
  }

  items = addGroupToList(currentGroup, items);
  items = addGroupToList(lastGroup, items);
  return items;
}
