/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import React, { Component } from "react";

import type { PreviewState } from "devtools/client/debugger/src/reducers/preview";

import { useAppSelector, useAppDispatch } from "ui/setup/hooks";

import { clearPreview } from "devtools/client/debugger/src/actions/preview";
import { getThreadContext } from "devtools/client/debugger/src/selectors";
import Popover from "../../shared/Popover";

import NewObjectInspector from "./NewObjectInspector";

interface PopupProps {
  preview: PreviewState["preview"];
  editorRef: HTMLDivElement;
  target: HTMLElement;
}

export function Popup({ editorRef, target, preview }: PopupProps) {
  const dispatch = useAppDispatch();
  const cx = useAppSelector(getThreadContext);

  const onMouseOut = () => {
    dispatch(clearPreview(cx, preview!.previewId));
  };

  const { cursorPos, value } = preview!;

  if (value === null) {
    return null;
  }

  // Primitives get rendered as a smaller "tooltip" style, above the line.
  // Other values get rendered as a larger "popover" style, below.

  // The backend returns primitive data in a field called `value`
  const isPrimitive = typeof value === "object" && "value" in value;
  const popoverType = isPrimitive ? "tooltip" : "popover";

  return (
    <Popover
      targetPosition={cursorPos}
      type={popoverType}
      editorRef={editorRef}
      target={target}
      mouseout={onMouseOut}
    >
      <NewObjectInspector protocolValue={value} />
    </Popover>
  );
}

export default Popup;
