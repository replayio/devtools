import { NodeBounds, ObjectId, PauseId } from "@replayio/protocol";
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { highlightNode, unhighlightNode } from "devtools/client/inspector/markup/actions/markup";
import { useMostRecentLoadedPause } from "replay-next/src/hooks/useMostRecentLoadedPause";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { getMouseEventPosition } from "ui/components/Video/getMouseEventPosition";
import { useAppDispatch } from "ui/setup/hooks";
import { boundingRectsCache, getMouseTarget } from "ui/suspense/nodeCaches";

export type NodePickerStatus = "active" | "disabled" | "error" | "initializing";
export type NodePickerType = "reactComponent" | "domElement";

export type NodePickerOptions = {
  limitToNodeIds?: Set<ObjectId>;
  onDismissed?: () => void;
  onSelected: (nodeId: ObjectId) => void;
  type: NodePickerType;
};

export type NodePickerContextType = {
  enable: (options: NodePickerOptions, initializer: () => Promise<void>) => Promise<void>;
  disable: () => void;
  status: NodePickerStatus;
  type: NodePickerType | null;
};

type State =
  | { options: NodePickerOptions; status: "active" | "error" | "initializing" }
  | { options: null; status: "disabled" };

export const NodePickerContext = createContext<NodePickerContextType>(null as any);

export function NodePickerContextRoot({ children }: PropsWithChildren<{}>) {
  const dispatch = useAppDispatch();

  const replayClient = useContext(ReplayClientContext);

  const { pauseId } = useMostRecentLoadedPause() ?? {};

  const mutableStateRef = useRef<{
    nodeId: ObjectId | null;
    pauseId: PauseId | null;
  }>({
    nodeId: null,
    pauseId: null,
  });

  const [state, setState] = useState<State>({
    options: null,
    status: "disabled",
  });

  // Shares most recently committed state with imperative methods (so we can memoize them more effectively)
  const committedStateRef = useRef<State>(state);
  useLayoutEffect(() => {
    committedStateRef.current.options = state.options;
    committedStateRef.current.status = state.status;
  });

  const enable = useCallback(
    async (options: NodePickerOptions, initializer: () => Promise<void>) => {
      const { status } = committedStateRef.current;

      switch (status) {
        case "active":
        case "initializing": {
          const { onDismissed } = options;

          if (onDismissed) {
            onDismissed();
          }
          break;
        }
      }

      setState({
        options,
        status: "initializing",
      });

      try {
        await initializer();

        setState({
          options,
          status: "active",
        });
      } catch (error) {
        console.error(error);

        setState({
          options,
          status: "error",
        });
      }
    },
    []
  );

  const disable = useCallback(() => {
    const { options, status } = committedStateRef.current;

    if (status === "disabled") {
      console.warn("NodePicker already disabled");
      return;
    }

    const { onDismissed } = options;

    setState({
      options: null,
      status: "disabled",
    });

    if (onDismissed) {
      onDismissed();
    }
  }, []);

  useLayoutEffect(() => {
    const { options, status } = state;

    // Reset the node picker whenever the Pause changes
    if (mutableStateRef.current.pauseId !== pauseId) {
      mutableStateRef.current.pauseId = pauseId ?? null;

      if (status !== "disabled") {
        disable();
      }

      return;
    }

    if (pauseId == null || status !== "active") {
      return;
    }

    // HACK The HTMLCanvasElement is only accessible via the DOM
    const graphicsElement = document.getElementById("graphics");
    if (graphicsElement == null) {
      console.error("Canvas not found");
      return;
    }

    // Start loading rects eagerly; we'll need them in the hover/click handlers
    let boundingRectsPromise: PromiseLike<NodeBounds[]> | NodeBounds[] | undefined;
    try {
      boundingRectsPromise = boundingRectsCache.readAsync(replayClient, pauseId);
    } catch {
      setState({
        status: "error",
        options,
      });
      return;
    }

    const { limitToNodeIds, onSelected } = options;

    const getNodeIdForMouseEvent = async (event: MouseEvent) => {
      const position = getMouseEventPosition(event);
      if (position != null) {
        const { x, y } = position;

        try {
          const boundingRects = await boundingRectsPromise!;
          const nodeBounds = getMouseTarget(boundingRects, x, y, limitToNodeIds);

          return nodeBounds?.node ?? null;
        } catch {
          setState({
            status: "error",
            options,
          });
          return null;
        }
      }

      return null;
    };

    const onDocumentClicked = (event: MouseEvent) => {
      if (event.defaultPrevented) {
        return;
      }

      disable();
    };

    const onCanvasMouseClick = async (event: MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();

      const nodeId = await getNodeIdForMouseEvent(event);
      if (nodeId != null) {
        onSelected(nodeId);
      }

      mutableStateRef.current.nodeId = null;

      dispatch(unhighlightNode());
      disable();
    };

    const onCanvasMouseMove = async (event: MouseEvent) => {
      const nodeId = await getNodeIdForMouseEvent(event);
      if (nodeId != null) {
        if (mutableStateRef.current.nodeId !== nodeId) {
          dispatch(highlightNode(nodeId));
        }
      } else {
        dispatch(unhighlightNode());
      }

      mutableStateRef.current.nodeId = nodeId;
    };

    setTimeout(() => {
      graphicsElement.addEventListener("click", onCanvasMouseClick);
      graphicsElement.addEventListener("mousemove", onCanvasMouseMove);
      document.addEventListener("click", onDocumentClicked);
    }, 0);

    // TRICKY
    // This effect needs to listen to document clicks to dismiss the picker
    // It should not dismiss the picker immediately after showing it,
    // although showing one picker should dismiss another active picker
    // The easiest way to accomplish this is to add the document handler after the click has finished processing
    return () => {
      graphicsElement.removeEventListener("click", onCanvasMouseClick);
      graphicsElement.removeEventListener("mousemove", onCanvasMouseMove);
      document.removeEventListener("click", onDocumentClicked);
    };
  }, [disable, dispatch, pauseId, replayClient, state]);

  const context = useMemo<NodePickerContextType>(
    () => ({
      enable,
      disable,
      status: state.status,
      type: state.options?.type ?? null,
    }),
    [disable, enable, state]
  );

  return <NodePickerContext.Provider value={context}>{children}</NodePickerContext.Provider>;
}
