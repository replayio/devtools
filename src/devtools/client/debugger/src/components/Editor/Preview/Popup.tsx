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

  const { cursorPos, value } = preview!;

  if (value === null) {
    return null;
  }

  return (
    <Popover
      targetPosition={cursorPos}
      type="popover"
      editorRef={editorRef}
      target={target}
      mouseout={onMouseOut}
    >
      <NewObjectInspector protocolValue={value} />
    </Popover>
  );
}

export default Popup;
