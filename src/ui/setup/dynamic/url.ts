import { ExecutionPoint, TimeStampedPointRange } from "@replayio/protocol";
import throttle from "lodash/throttle";

import { getExecutionPoint, getTime } from "devtools/client/debugger/src/selectors";
import { ReplayClientInterface } from "shared/client/types";
import type { ViewMode } from "shared/user-data/GraphQL/config";
import { decodeBase64FromURL, encodeObjectToURL } from "shared/utils/environment";
import { getSelectedCommentId } from "ui/reducers/app";
import { getSelectedPanel, getSelectedPrimaryPanel, getViewMode } from "ui/reducers/layout";
import type { AppStore } from "ui/setup/store";
import type { PrimaryPanelName, SecondaryPanelName } from "ui/state/layout";

export type MutableURLParams = {
  commentId: string | null;
  focusWindow: TimeStampedPointRange | null;
  point: ExecutionPoint | null;
  primaryPanel: PrimaryPanelName | null;
  secondaryPanel: SecondaryPanelName | null;
  time: number | null;
  viewMode: ViewMode | null;
};

// This method returns a subset of URL parameters, ones that change to mirror Redux state;
// Read-only parameters are managed by shared/utils/environment
export function getMutableParamsFromURL(): MutableURLParams {
  const { searchParams } = getURL();

  let focusWindowParam = searchParams.get("focusWindow") ?? null;
  let focusWindow: TimeStampedPointRange | null = null;
  if (focusWindowParam) {
    try {
      focusWindow = decodeBase64FromURL(focusWindowParam) as TimeStampedPointRange;
    } catch (error) {}
  }

  let time: number | null = null;
  const timeParam = searchParams.get("time");
  if (timeParam) {
    const maybeTime = +timeParam;
    if (!isNaN(maybeTime)) {
      time = maybeTime;
    }
  }

  return {
    commentId: searchParams.get("commentId"),
    focusWindow,
    point: searchParams.get("point"),
    primaryPanel: searchParams.get("primaryPanel") as PrimaryPanelName | null,
    secondaryPanel: searchParams.get("secondaryPanel") as SecondaryPanelName | null,
    time,
    viewMode: searchParams.get("viewMode") as ViewMode | null,
  };
}

export function getURL(): URL {
  const url = typeof window !== "undefined" ? window.location.href : "https://app.replay.io";
  return new URL(url);
}

// WARNING
// Do not call this method until all reducers have been initialized.
export function setUpUrlParamsListener(store: AppStore, replayClient: ReplayClientInterface) {
  // Subscribe to Redux changes so we can sync them to the URL
  //
  // We could subscribe to store changes using startAppListening()
  // but since there are multiple things we're checking,
  // it seems more straightforward to just subscribe to the store directly
  // and throttle the updates.
  store.subscribe(
    throttle(function onChange() {
      const state = store.getState();

      const commentId = getSelectedCommentId(state);
      const point = getExecutionPoint(state);
      const primaryPanel = getSelectedPrimaryPanel(state);
      const secondaryPanel = getSelectedPanel(state);
      const time = getTime(state);
      const viewMode = getViewMode(state);

      // This action signals a change in the focus window,
      // but the payload only contains times (numbers).
      // ReplayClient contains the higher resolution execution points.
      // The timeline actions awaits ReplayClient before finishing.
      const focusWindow = replayClient.getCurrentFocusWindow();

      const params: { [key in keyof MutableURLParams]: string | undefined } = {
        commentId: commentId != null ? commentId : undefined,
        focusWindow: focusWindow != null ? encodeObjectToURL(focusWindow) : undefined,
        point: point != null ? point : undefined,
        primaryPanel: primaryPanel != null ? primaryPanel : undefined,
        secondaryPanel: secondaryPanel != null ? secondaryPanel : undefined,
        time: time != null ? `${time}` : undefined,
        viewMode: viewMode != null ? viewMode : undefined,
      };

      const newUrl = getURL();
      Object.entries(params).forEach(([key, value]) => {
        newUrl.searchParams.set(key, value ?? "");
      });

      if (getURL().toString() !== newUrl.toString()) {
        window.history.replaceState({}, "", newUrl.toString());
      }
    }, 1_000)
  );
}
