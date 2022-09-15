/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import Popover from "devtools/client/debugger/src/components/shared/Popover";
import { previewCleared } from "devtools/client/debugger/src/reducers/preview";
import type { PreviewState } from "devtools/client/debugger/src/reducers/preview";
import { getThreadContext } from "devtools/client/debugger/src/selectors";
import React from "react";
import { useAppSelector, useAppDispatch } from "ui/setup/hooks";

import NewObjectInspector from "./NewObjectInspector";

interface PopupProps {
  preview: PreviewState;
  editorRef: HTMLDivElement;
  target: HTMLElement;
}

export function Popup({ editorRef, target, preview }: PopupProps) {
  const dispatch = useAppDispatch();
  const cx = useAppSelector(getThreadContext);

  const onMouseOut = () => {
    dispatch(previewCleared({ cx, previewId: preview!.previewId }));
  };

  const { cursorPos, expression, value } = preview!;

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
      <NewObjectInspector expression={expression} protocolValue={value} />
    </Popover>
  );
}

export default Popup;
