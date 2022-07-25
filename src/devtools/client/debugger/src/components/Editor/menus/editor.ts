/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import { bindActionCreators } from "redux";
import type { Context } from "devtools/client/debugger/src/reducers/pause";
import type { AppDispatch } from "ui/setup/store";

import { copyToTheClipboard } from "../../../utils/clipboard";
import actions from "../../../actions";
import { getRawSourceURL, shouldBlackbox } from "../../../utils/source";
import { getSourcemapVisualizerURL } from "../../../utils/sourceVisualizations";
import type { SourceDetails } from "ui/reducers/sources";

type EditorActions = ReturnType<typeof editorItemActions>;

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

// TODO Re-enable blackboxing
/*
const blackBoxMenuItem = (cx: Context, selectedSource: Source, editorActions: EditorActions) => ({
  id: "node-menu-blackbox",
  label: selectedSource.isBlackBoxed ? "Unblackbox source" : "Blackbox source",
  accesskey: selectedSource.isBlackBoxed ? "U" : "B",
  disabled: !shouldBlackbox(selectedSource),
  click: () => editorActions.toggleBlackBox(cx, selectedSource),
});
*/

const sourceMapItem = (
  cx: Context,
  selectedSource: SourceDetails,
  alternateSource: SourceDetails | null
) => ({
  id: "node-menu-source-map",
  label: "Visualize source map",
  // TODO Re-enable blackboxing
  accesskey: /*selectedSource.isBlackBoxed ? "U" : */ "B",
  disabled: !getSourcemapVisualizerURL(selectedSource, alternateSource),
  click: () => {
    const href = getSourcemapVisualizerURL(selectedSource, alternateSource);
    if (href) {
      window.open(href, "_blank");
    }
  },
});

export function editorMenuItems({
  cx,
  editorActions,
  selectedSource,
  alternateSource,
}: {
  cx: Context;
  editorActions: EditorActions;
  selectedSource: SourceDetails;
  alternateSource: SourceDetails | null;
}) {
  const items = [];

  items.push(
    copySourceUri2Item(selectedSource),
    { type: "separator" },
    showSourceMenuItem(cx, selectedSource, editorActions),
    // TODO Re-enable blackboxing
    // blackBoxMenuItem(cx, selectedSource, editorActions),
    sourceMapItem(cx, selectedSource, alternateSource)
  );

  return items;
}

export function editorItemActions(dispatch: AppDispatch) {
  return bindActionCreators(
    {
      flashLineRange: actions.flashLineRange,
      showSource: actions.showSource,
      toggleBlackBox: actions.toggleBlackBox,
    },
    dispatch
  );
}
