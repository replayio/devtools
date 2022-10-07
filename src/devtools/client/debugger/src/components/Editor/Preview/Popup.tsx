import Popover from "devtools/client/debugger/src/components/shared/Popover";
import { previewCleared } from "devtools/client/debugger/src/reducers/preview";
import type { PreviewState } from "devtools/client/debugger/src/reducers/preview";
import { getThreadContext } from "devtools/client/debugger/src/selectors";
import { RefObject, useCallback } from "react";
import { useAppSelector, useAppDispatch } from "ui/setup/hooks";

import NewObjectInspector from "./NewObjectInspector";

interface PopupProps {
  preview: PreviewState;
  editorRef: RefObject<HTMLDivElement>;
  target: HTMLElement;
}

export function Popup({ editorRef, target, preview }: PopupProps) {
  const dispatch = useAppDispatch();
  const cx = useAppSelector(getThreadContext);

  let previewId: string | null = null;
  let value = null;
  if (preview !== null) {
    previewId = preview.previewId;
    value = preview.value;
  }

  const onMouseLeave = useCallback(() => {
    if (previewId !== null) {
      dispatch(previewCleared({ cx, previewId }));
    }
  }, [cx, dispatch, previewId]);

  if (value === null) {
    return null;
  }

  return (
    <Popover containerRef={editorRef} onMouseLeave={onMouseLeave} showTail={true} target={target}>
      <NewObjectInspector protocolValue={value} />
    </Popover>
  );
}

export default Popup;
