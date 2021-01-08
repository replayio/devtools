/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import { bindActionCreators } from "redux";
import { copyToTheClipboard } from "../../../utils/clipboard";
import { getRawSourceURL, getFilename, shouldBlackbox } from "../../../utils/source";
import { downloadFile } from "../../../utils/utils";
import actions from "../../../actions";
import { isFulfilled } from "../../../utils/async-value";

// menu items

const copyToClipboardItem = (selectedContent, editorActions) => ({
  id: "node-menu-copy-to-clipboard",
  label: "Copy to clipboard",
  accesskey: "C",
  disabled: false,
  click: () => selectedContent.type === "text" && copyToTheClipboard(selectedContent.value),
});

const copySourceItem = (selectedSource, selectionText, editorActions) => ({
  id: "node-menu-copy-source",
  label: "Copy source text",
  accesskey: "y",
  disabled: selectionText.length === 0,
  click: () => copyToTheClipboard(selectionText),
});

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

const evaluateInConsoleItem = (selectedSource, selectionText, editorActions) => ({
  id: "node-menu-evaluate-in-console",
  label: "Evaluate in console",
  click: () => editorActions.evaluateInConsole(selectionText),
});

const downloadFileItem = (selectedSource, selectedContent, editorActions) => ({
  id: "node-menu-download-file",
  label: "Download file",
  accesskey: "d",
  click: () => downloadFile(selectedContent, getFilename(selectedSource)),
});

export function editorMenuItems({
  cx,
  editorActions,
  selectedSource,
  selectionText,
  isTextSelected,
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
