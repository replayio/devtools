/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import { bindActionCreators } from "@reduxjs/toolkit";
import { PauseId } from "@replayio/protocol";

import type { Context, PauseAndFrameId } from "devtools/client/debugger/src/reducers/pause";
import { ReplayClientInterface } from "shared/client/types";
import type { SourceDetails, SourcesState } from "ui/reducers/sources";
import type { AppDispatch } from "ui/setup/store";

import actions from "../../../actions";
import { copyToTheClipboard } from "../../../utils/clipboard";
import { getRawSourceURL } from "../../../utils/source";
import { getSourcemapVisualizerURLSuspense } from "../../../utils/sourceVisualizations";

type EditorActions = ReturnType<typeof editorItemActions>;

// TODO [FE-926] Review source editor context menu for re-adding later
// This includes actual implementation (legacy FF menu vs something new),
// as well as what menu items it should contain.

// menu items

const copySourceUri2Item = (selectedSource: SourceDetails) => ({
  id: "node-menu-copy-source-url",
  label: "Copy source URI",
  accesskey: "u",
  disabled: !selectedSource.url,
  click: () => copyToTheClipboard(getRawSourceURL(selectedSource.url)),
});

const showSourceMenuItem = (
  cx: Context,
  selectedSource: SourceDetails,
  editorActions: EditorActions
) => ({
  id: "node-menu-show-source",
  label: "Reveal in tree",
  accesskey: "r",
  disabled: !selectedSource.url,
  click: () => editorActions.showSource(cx, selectedSource.id),
});

const sourceMapItem = (
  replayClient: ReplayClientInterface,
  pauseId: PauseId | undefined,
  selectedSource: SourceDetails,
  selectedFrameId: PauseAndFrameId | null,
  sourcesState: SourcesState
) => {
  let visualizerURL: string | null = null;
  if (pauseId) {
    try {
      visualizerURL = getSourcemapVisualizerURLSuspense(
        replayClient,
        selectedSource,
        selectedFrameId,
        sourcesState
      );
    } catch {}
  }

  return {
    id: "node-menu-source-map",
    label: "Visualize source map",
    accesskey: "B",
    disabled: !visualizerURL,
    click: () => {
      if (visualizerURL) {
        window.open(visualizerURL, "_blank");
      }
    },
  };
};

export function editorMenuItems({
  replayClient,
  cx,
  editorActions,
  pauseId,
  selectedSource,
  selectedFrameId,
  sourcesState,
}: {
  replayClient: ReplayClientInterface;
  cx: Context;
  editorActions: EditorActions;
  pauseId: PauseId | undefined;
  selectedSource: SourceDetails;
  selectedFrameId: PauseAndFrameId | null;
  sourcesState: SourcesState;
}) {
  const items = [];

  items.push(
    copySourceUri2Item(selectedSource),
    { type: "separator" },
    showSourceMenuItem(cx, selectedSource, editorActions),
    sourceMapItem(replayClient, pauseId, selectedSource, selectedFrameId, sourcesState)
  );

  return items;
}

export function editorItemActions(dispatch: AppDispatch) {
  return bindActionCreators(
    {
      flashLineRange: actions.flashLineRange,
      showSource: actions.showSource,
    },
    dispatch
  );
}
