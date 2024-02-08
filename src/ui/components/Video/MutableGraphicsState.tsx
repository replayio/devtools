// The recording graphics (screenshots) are global state; there is only one rendered (in the DOM) at any point in time
// Although declarative (React) components render graphics (e.g. comments, DOM highlights, recorded cursor)
// it is better for performance if imperative code (re)positions these elements,
// otherwise there may be "render lag" when windows are resized.
//
// This module provides a subscribe method for that imperative positioning logic,
// and an accompanying update method for notifying subscribers.
//
// This module also exports the global/mutable state directly, in case other imperative code requires it for single use purposes,
// e.g. calculate relative position information from a MouseEvent.
//
// This approach is unusual, but it's arguably cleaner than sharing these values via the DOM.

export interface GraphicsState {
  height: number;
  left: number;
  localScale: number;
  recordingScale: number;
  top: number;
  width: number;
}

type Callback = (state: GraphicsState) => void;
type Unsubscribe = () => void;

export const mutableState: GraphicsState = {
  height: 0,
  left: 0,
  localScale: 1,
  recordingScale: 1,
  top: 0,
  width: 0,
};

const subscribers: Set<Callback> = new Set();

export function subscribe(callback: Callback): Unsubscribe {
  subscribers.add(callback);

  callback(mutableState);

  return () => {
    subscribers.delete(callback);
  };
}
export function update({ element, scale }: { element: HTMLImageElement; scale?: number }) {
  const { clientHeight, clientWidth, naturalWidth } = element;

  const { left, top } = element.getBoundingClientRect();
  const localScale = isNaN(clientWidth / naturalWidth)
    ? mutableState.localScale
    : clientWidth / naturalWidth;
  const recordingScale = scale ?? mutableState.recordingScale;

  if (
    mutableState.height != clientHeight ||
    mutableState.left != left ||
    mutableState.localScale != localScale ||
    mutableState.recordingScale != recordingScale ||
    mutableState.top != top ||
    mutableState.width != clientWidth
  ) {
    mutableState.height = clientHeight;
    mutableState.left = left;
    mutableState.localScale = localScale;
    mutableState.recordingScale = recordingScale;
    mutableState.top = top;
    mutableState.width = clientWidth;

    subscribers.forEach(callback => {
      callback(mutableState);
    });
  }
}
