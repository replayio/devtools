/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { bindActionCreators } from "redux";

import { copyToTheClipboard } from "../../../utils/clipboard";
import { getRawSourceURL, getFilename, shouldBlackbox } from "../../../utils/source";

import { downloadFile } from "../../../utils/utils";
import { features } from "../../../utils/prefs";

import { isFulfilled } from "../../../utils/async-value";
import actions from "../../../actions";

// menu items

const copyToClipboardItem = (selectedContent, editorActions) => ({
  id: "node-menu-copy-to-clipboard",
  label: L10N.getStr("copyToClipboard.label"),
  accesskey: L10N.getStr("copyToClipboard.accesskey"),
  disabled: false,
  click: () => selectedContent.type === "text" && copyToTheClipboard(selectedContent.value),
});

const copySourceItem = (selectedSource, selectionText, editorActions) => ({
  id: "node-menu-copy-source",
  label: L10N.getStr("copySource.label"),
  accesskey: L10N.getStr("copySource.accesskey"),
  disabled: selectionText.length === 0,
  click: () => copyToTheClipboard(selectionText),
});

const copySourceUri2Item = (selectedSource, editorActions) => ({
  id: "node-menu-copy-source-url",
  label: L10N.getStr("copySourceUri2"),
  accesskey: L10N.getStr("copySourceUri2.accesskey"),
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
    selectedSource.isOriginal ? L10N.getStr("generated") : L10N.getStr("original")
  ),
  accesskey: L10N.getStr("editor.jumpToMappedLocation1.accesskey"),
  disabled: !hasMappedLocation,
  click: () => editorActions.jumpToMappedLocation(cx, location),
});

const showSourceMenuItem = (cx, selectedSource, editorActions) => ({
  id: "node-menu-show-source",
  label: L10N.getStr("sourceTabs.revealInTree"),
  accesskey: L10N.getStr("sourceTabs.revealInTree.accesskey"),
  disabled: !selectedSource.url,
  click: () => editorActions.showSource(cx, selectedSource.id),
});

const blackBoxMenuItem = (cx, selectedSource, editorActions) => ({
  id: "node-menu-blackbox",
  label: selectedSource.isBlackBoxed
    ? L10N.getStr("blackboxContextItem.unblackbox")
    : L10N.getStr("blackboxContextItem.blackbox"),
  accesskey: selectedSource.isBlackBoxed
    ? L10N.getStr("blackboxContextItem.unblackbox.accesskey")
    : L10N.getStr("blackboxContextItem.blackbox.accesskey"),
  disabled: !shouldBlackbox(selectedSource),
  click: () => editorActions.toggleBlackBox(cx, selectedSource),
});

const evaluateInConsoleItem = (selectedSource, selectionText, editorActions) => ({
  id: "node-menu-evaluate-in-console",
  label: L10N.getStr("evaluateInConsole.label"),
  click: () => editorActions.evaluateInConsole(selectionText),
});

const downloadFileItem = (selectedSource, selectedContent, editorActions) => ({
  id: "node-menu-download-file",
  label: L10N.getStr("downloadFile.label"),
  accesskey: L10N.getStr("downloadFile.accesskey"),
  click: () => downloadFile(selectedContent, getFilename(selectedSource)),
});

export function editorMenuItems({
  cx,
  editorActions,
  selectedSource,
  location,
  selectionText,
  hasMappedLocation,
  isTextSelected,
  isPaused,
}) {
  const items = [];

  const content =
    selectedSource.content && isFulfilled(selectedSource.content)
      ? selectedSource.content.value
      : null;

  items.push(
    ...(content ? [copyToClipboardItem(content, editorActions)] : []),
    copySourceItem(selectedSource, selectionText, editorActions),
    copySourceUri2Item(selectedSource, editorActions),
    ...(content ? [downloadFileItem(selectedSource, content, editorActions)] : []),
    { type: "separator" },
    showSourceMenuItem(cx, selectedSource, editorActions),
    blackBoxMenuItem(cx, selectedSource, editorActions)
  );

  if (isTextSelected) {
    items.push(
      { type: "separator" },
      evaluateInConsoleItem(selectedSource, selectionText, editorActions)
    );
  }

  return items;
}

export function editorItemActions(dispatch) {
  return bindActionCreators(
    {
      evaluateInConsole: actions.evaluateInConsole,
      flashLineRange: actions.flashLineRange,
      jumpToMappedLocation: actions.jumpToMappedLocation,
      showSource: actions.showSource,
      toggleBlackBox: actions.toggleBlackBox,
    },
    dispatch
  );
}
