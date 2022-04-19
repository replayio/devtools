/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import { bindActionCreators } from "redux";

import actions from "../../../actions";
import { copyToTheClipboard } from "../../../utils/clipboard";
import { getRawSourceURL, getSourcemapVisualizerURL, shouldBlackbox } from "../../../utils/source";

// menu items

const copySourceUri2Item = (selectedSource, editorActions) => ({
  accesskey: "u",
  click: () => copyToTheClipboard(getRawSourceURL(selectedSource.url)),
  disabled: !selectedSource.url,
  id: "node-menu-copy-source-url",
  label: "Copy source URI",
});

const jumpToMappedLocationItem = (
  cx,
  selectedSource,
  location,
  hasMappedLocation,
  editorActions
) => ({
  accesskey: "m",
  click: () => editorActions.jumpToMappedLocation(cx, location),
  disabled: !hasMappedLocation,
  id: "node-menu-jump",
  label: L10N.getFormatStr(
    "editor.jumpToMappedLocation1",
    selectedSource.isOriginal ? "generated" : "original"
  ),
});

const showSourceMenuItem = (cx, selectedSource, editorActions) => ({
  accesskey: "r",
  click: () => editorActions.showSource(cx, selectedSource.id),
  disabled: !selectedSource.url,
  id: "node-menu-show-source",
  label: "Reveal in tree",
});

const blackBoxMenuItem = (cx, selectedSource, editorActions) => ({
  accesskey: selectedSource.isBlackBoxed ? "U" : "B",
  click: () => editorActions.toggleBlackBox(cx, selectedSource),
  disabled: !shouldBlackbox(selectedSource),
  id: "node-menu-blackbox",
  label: selectedSource.isBlackBoxed ? "Unblackbox source" : "Blackbox source",
});

const sourceMapItem = (cx, selectedSource, alternateSource, editorActions) => ({
  accesskey: selectedSource.isBlackBoxed ? "U" : "B",
  click: () => {
    const href = getSourcemapVisualizerURL(selectedSource, alternateSource);
    if (href) {
      window.open(href, "_blank");
    }
  },
  disabled: !getSourcemapVisualizerURL(selectedSource, alternateSource),
  id: "node-menu-source-map",
  label: "Visualize source map",
});

export function editorMenuItems({ cx, editorActions, selectedSource, alternateSource }) {
  const items = [];

  items.push(
    copySourceUri2Item(selectedSource, editorActions),
    { type: "separator" },
    showSourceMenuItem(cx, selectedSource, editorActions),
    blackBoxMenuItem(cx, selectedSource, editorActions),
    sourceMapItem(cx, selectedSource, alternateSource, editorActions)
  );

  return items;
}

export function editorItemActions(dispatch) {
  return bindActionCreators(
    {
      flashLineRange: actions.flashLineRange,
      jumpToMappedLocation: actions.jumpToMappedLocation,
      showSource: actions.showSource,
      toggleBlackBox: actions.toggleBlackBox,
    },
    dispatch
  );
}
