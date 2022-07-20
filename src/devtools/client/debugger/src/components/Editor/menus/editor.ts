/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import { bindActionCreators } from "redux";
import { copyToTheClipboard } from "../../../utils/clipboard";
import actions from "../../../actions";
import { getRawSourceURL, shouldBlackbox } from "../../../utils/source";
import { getSourcemapVisualizerURL } from "../../../utils/sourceVisualizations";

// menu items

const copySourceUri2Item = (selectedSource, editorActions) => ({
  id: "node-menu-copy-source-url",
  label: "Copy source URI",
  accesskey: "u",
  disabled: !selectedSource.url,
  click: () => copyToTheClipboard(getRawSourceURL(selectedSource.url)),
});

const jumpToMappedLocationItem = (
  cx,
  selectedSource,
  location,
  hasMappedLocation,
  editorActions
) => ({
  id: "node-menu-jump",
  label: L10N.getFormatStr(
    "editor.jumpToMappedLocation1",
    selectedSource.isOriginal ? "generated" : "original"
  ),
  accesskey: "m",
  disabled: !hasMappedLocation,
  click: () => editorActions.jumpToMappedLocation(cx, location),
});

const showSourceMenuItem = (cx, selectedSource, editorActions) => ({
  id: "node-menu-show-source",
  label: "Reveal in tree",
  accesskey: "r",
  disabled: !selectedSource.url,
  click: () => editorActions.showSource(cx, selectedSource.id),
});

const blackBoxMenuItem = (cx, selectedSource, editorActions) => ({
  id: "node-menu-blackbox",
  label: selectedSource.isBlackBoxed ? "Unblackbox source" : "Blackbox source",
  accesskey: selectedSource.isBlackBoxed ? "U" : "B",
  disabled: !shouldBlackbox(selectedSource),
  click: () => editorActions.toggleBlackBox(cx, selectedSource),
});

const sourceMapItem = (cx, selectedSource, alternateSource, editorActions) => ({
  id: "node-menu-source-map",
  label: "Visualize source map",
  accesskey: selectedSource.isBlackBoxed ? "U" : "B",
  disabled: !getSourcemapVisualizerURL(selectedSource, alternateSource),
  click: () => {
    const href = getSourcemapVisualizerURL(selectedSource, alternateSource);
    if (href) {
      window.open(href, "_blank");
    }
  },
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
