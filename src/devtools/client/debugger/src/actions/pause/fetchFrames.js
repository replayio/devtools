/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

// How many times to fetch an async set of parent frames.
const MaxAsyncFrames = 5;

export function fetchFrames(cx) {
  return async function ({ dispatch, client, getState }) {
    let frames;
    try {
      frames = await client.getFrames();
    } catch (e) {}
    dispatch({ type: "FETCHED_FRAMES", frames, cx });

    for (let i = 0; i < MaxAsyncFrames; i++) {
      let asyncFrames;
      try {
        asyncFrames = await client.loadAsyncParentFrames(i + 1);
      } catch (e) {
        break;
      }
      if (!asyncFrames.length) {
        break;
      }
      dispatch({ type: "ADD_ASYNC_FRAMES", asyncFrames, cx });
    }
  };
}
