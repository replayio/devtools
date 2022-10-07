/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { Context, PauseFrame, ThreadContext } from "../../../reducers/pause";

export interface CommonFrameComponentProps {
  cx: ThreadContext;
  selectedFrame: PauseFrame | null;
  selectFrame: (cx: Context, frame: PauseFrame) => void;
  disableContextMenu: boolean;
  displayFullUrl: boolean;
  panel: "console" | "debugger" | "webconsole" | "networkmonitor";
  frameworkGroupingOn: boolean;
  copyStackTrace: () => void;
  toggleFrameworkGrouping: () => void;
}
