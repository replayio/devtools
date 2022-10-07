import Popover from "devtools/client/debugger/src/components/shared/Popover";
import { previewCleared } from "devtools/client/debugger/src/reducers/preview";
import type { PreviewState } from "devtools/client/debugger/src/reducers/preview";
import { getThreadContext } from "devtools/client/debugger/src/selectors";
import { RefObject, useCallback } from "react";
import { useAppSelector, useAppDispatch } from "ui/setup/hooks";

import NewObjectInspector from "./NewObjectInspector";

interface PopupProps {
  containerRef: RefObject<HTMLDivElement>;
  preview: PreviewState;
  target: HTMLElement;
}

export function Popup({ containerRef, target, preview }: PopupProps) {
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
    <Popover
      containerRef={containerRef}
      onMouseLeave={onMouseLeave}
      showTail={true}
      target={target}
    >
      <NewObjectInspector protocolValue={value} />
    </Popover>
  );
}

export default Popup;
