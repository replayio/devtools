import { addBreakpointAtLine } from "devtools/client/debugger/src/actions/breakpoints";
import { PartialLocation } from "devtools/client/debugger/src/actions/sources";
import { updateCursorPosition, updateViewport } from "devtools/client/debugger/src/actions/ui";
import {
  getSymbols,
  getThreadContext,
  SymbolEntry,
  ThreadContext,
} from "devtools/client/debugger/src/selectors";
import {
  showSourceText,
  showErrorMessage,
  getEditor,
  clearEditor,
  lineAtHeight,
  fromEditorLine,
  getDocument,
  scrollToColumn,
  toEditorLine,
  toEditorColumn,
  getSourceLocationFromMouseEvent,
  hasDocument,
  onTokenMouseOver,
  onLineMouseOver,
  onMouseScroll,
  startOperation,
  endOperation,
  showLoading,
} from "devtools/client/debugger/src/utils/editor";
import type {
  EditorWithDoc,
  SourceEditor,
} from "devtools/client/debugger/src/utils/editor/source-editor";
import { getIndentation } from "devtools/client/debugger/src/utils/indentation";
import { resizeToggleButton, resizeBreakpointGutter } from "devtools/client/debugger/src/utils/ui";
import debounce from "lodash/debounce";
import { RefObject, useLayoutEffect, useRef, useState } from "react";
import { isFirefox } from "ui/utils/environment";
import {
  getSelectedSource,
  getSelectedLocation,
  getSelectedSourceWithContent,
  SourceDetails,
  SourceContent,
} from "ui/reducers/sources";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { LoadingStatus } from "ui/utils/LoadingStatus";

import useHighlightedLines from "./useHighlightedLines";
import useLineHitCounts from "./useLineHitCounts";

type InstanceProps = {
  cx: ThreadContext;
  lastClientX: number;
  lastClientY: number;
  selectedLocation: PartialLocation | null;
  selectedSource: SourceDetails | null;
  selectedSourceContent: SourceContent | null;
  symbols: SymbolEntry | null;
};

type PrevProps = Partial<Omit<InstanceProps, "cx" | "lastClientX" | "lastClientY">>;

export default function useEditor(
  containerRef: RefObject<HTMLDivElement>,
  setContextMenu: (event: MouseEvent | null) => void
): SourceEditor | null {
  const dispatch = useAppDispatch();

  const cx = useAppSelector(getThreadContext);
  const selectedLocation = useAppSelector(getSelectedLocation);
  const selectedSource = useAppSelector(getSelectedSource) || null;
  const selectedSourceContent = useAppSelector(getSelectedSourceWithContent) || null;
  const symbols = useAppSelector(state => getSymbols(state, selectedSource as any));

  const instancePropsRef = useRef<InstanceProps>({
    cx,
    lastClientX: 0,
    lastClientY: 0,
    selectedLocation,
    selectedSource,
    selectedSourceContent,
    symbols,
  });
  const prevPropsRef = useRef<PrevProps>({
    selectedLocation: null,
    selectedSource: null,
    selectedSourceContent: null,
    symbols: null,
  });

  const [editor, setEditor] = useState<SourceEditor | null>(null);

  // Create and destroy the SourceEditor on mount/unmount.
  // This effect should come before the others because it (re)creates the Editor instance the others reference.
  //
  // Only stable values should be used as dependencies (e.g. React refs, state updater functions, Redux dispatch)
  useLayoutEffect(() => {
    const editor = getEditor();

    setEditor(editor);

    const container = containerRef.current!;

    // disables the default search shortcuts
    // @ts-expect-error initShortcuts doesn't exist
    editor._initShortcuts = () => {};

    // HACK
    // Code Mirror 5 does not properly handle remounting by the Offscreen API
    // so we have to manually clean up the DOM in between.
    if (container instanceof HTMLElement) {
      const editorMount: HTMLElement = container.querySelector(".editor-mount")!;
      while (editorMount.firstChild) {
        editorMount.removeChild(editorMount.firstChild);
      }
      editor.appendToLocalElement(editorMount);
    }

    // Set code editor wrapper to be focusable
    const codeMirrorWrapper = editor.codeMirror.getWrapperElement();
    codeMirrorWrapper.tabIndex = 0;

    // Destroy the editor on unmount
    return () => {
      editor.destroy();

      setEditor(null);
    };
  }, [containerRef]);

  // Update "instance" props after each commit;
  // This simplifies the layout effects below that attach event listeners,
  // since it allows them to only run on-mount rather than after every update.
  //
  // This hook should run before other event handler effects to ensure "instance" props are updated first.
  useLayoutEffect(() => {
    const instanceProps = instancePropsRef.current;
    instanceProps.cx = cx;
    instanceProps.selectedSource = selectedSource;
    instanceProps.selectedLocation = selectedLocation;
    instanceProps.selectedSource = selectedSource;
    instanceProps.selectedSourceContent = selectedSourceContent;
    instanceProps.symbols = symbols;
  });

  // Update editor and/or react to changed props after props render
  useLayoutEffect(() => {
    if (editor === null) {
      // This hook only uses prev props when there's an Editor.
      // If the hook is called without an Editor (as part of mounting/remounting) we can bail out early.
      return;
    }

    const { selectedSource, selectedSourceContent, selectedLocation, symbols } =
      instancePropsRef.current;
    const { selectedSource: prevSelectedSource } = prevPropsRef.current;

    startOperation();
    setTextHelper(editor, instancePropsRef.current);
    scrollToLocationHelper(editor, prevPropsRef.current, instancePropsRef.current);
    endOperation();

    if (selectedSource != prevSelectedSource) {
      dispatch(updateViewport);

      resizeBreakpointGutter(editor.codeMirror);
      resizeToggleButton(editor.codeMirror);
    }

    const prevProps = prevPropsRef.current;
    prevProps.selectedSource = selectedSource;
    prevProps.selectedLocation = selectedLocation;
    prevProps.selectedSource = selectedSource;
    prevProps.selectedSourceContent = selectedSourceContent;
    prevProps.symbols = symbols;
  });

  // Add event listeners to SourceEditor
  // Only stable values should be used as dependencies (e.g. React refs, state updater functions, Redux dispatch)
  // The Editor instance is an exception; ideally it would be stable as well but Code Mirror 5 doesn't handle remounting
  useLayoutEffect(() => {
    if (editor === null) {
      return;
    }

    const { codeMirror } = editor;

    const openMenuHelper = (event: MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();

      const { selectedSource } = instancePropsRef.current;
      if (!selectedSource) {
        return;
      }

      const target = event.target;
      const line = lineAtHeight(editor, event);
      if (typeof line != "number") {
        return;
      } else if ((target as HTMLElement).getAttribute("id") === "columnmarker") {
        return;
      }

      setContextMenu(event);
    };

    const onCodeMirrorClick = (event: MouseEvent) => {
      const { selectedSource } = instancePropsRef.current;
      if (selectedSource) {
        dispatch(
          updateCursorPosition(getSourceLocationFromMouseEvent(editor, selectedSource, event))
        );
      }
    };

    const onCodeMirrorContextMenu = (_: any, __: number, ___: any, event: MouseEvent) => {};

    const onCodeMirrorGutterClick = (_: any, line: number, __: any, event: MouseEvent) => {
      const { button, ctrlKey, target } = event;
      const { cx, selectedSource } = instancePropsRef.current;

      if ((ctrlKey && button === 0) || button === 2 || !selectedSource) {
        // ignore right clicks in the gutter
        return;
      } else if (typeof line !== "number") {
        return;
      } else if (![...(target as HTMLElement).classList].includes("CodeMirror-linenumber")) {
        // Don't add a breakpoint if the user clicked on something other than the gutter line number,
        // e.g., the blank gutter space caused by adding a CodeMirror widget.
        return;
      }

      return dispatch(addBreakpointAtLine(cx, fromEditorLine(line)));
    };

    const onCodeMirrorKeyDown = (event: KeyboardEvent) => {
      const { key, target } = event;
      const codeWrapper = codeMirror.getWrapperElement();
      const textArea = codeWrapper.querySelector("textArea");

      if (key === "ArrowRight" || key === "ArrowLeft") {
        event.preventDefault();
      } else if (key === "Escape" && target == textArea) {
        event.stopPropagation();
        event.preventDefault();

        codeWrapper.focus();
      } else if (key === "Enter" && target == codeWrapper) {
        event.preventDefault();

        // Focus into editor's text area
        (textArea as HTMLElement)!.focus();
      }
    };

    const onCodeMirrorScrollDebounced = debounce((...args) => {
      const { lastClientX, lastClientY } = instancePropsRef.current;
      dispatch(updateViewport());
      onMouseScroll(codeMirror, lastClientX, lastClientY);
    }, 75);

    const onDocumentMouseMove = (event: MouseEvent) => {
      // Store mouse coords so we can use them during a CodeMirror "scroll" event.
      const instanceProps = instancePropsRef.current;
      instanceProps.lastClientX = event.clientX;
      instanceProps.lastClientY = event.clientY;
    };

    const onCodeMirrorMouseOverToken = onTokenMouseOver(codeMirror);
    const onCodeMirrorMouseOverLine = onLineMouseOver(codeMirror);

    document.addEventListener("mousemove", onDocumentMouseMove);

    // @ts-expect-error Unknown "gutterClick" event type
    codeMirror.on("gutterClick", onCodeMirrorGutterClick);
    codeMirror.on("scroll", onCodeMirrorScrollDebounced);

    const codeMirrorWrapper = codeMirror.getWrapperElement();
    codeMirrorWrapper.addEventListener("keydown", onCodeMirrorKeyDown);
    codeMirrorWrapper.addEventListener("click", onCodeMirrorClick);
    codeMirrorWrapper.addEventListener("mouseover", onCodeMirrorMouseOverToken);
    codeMirrorWrapper.addEventListener("mouseover", onCodeMirrorMouseOverLine);

    let onCodeMirrorGutterContextMenu: Function = null as any;
    if (!isFirefox()) {
      onCodeMirrorGutterContextMenu = (_: EditorWithDoc, event: MouseEvent) => {
        openMenuHelper(event);
      };

      // @ts-expect-error Handler param types mismatch
      codeMirror.on("contextmenu", onCodeMirrorContextMenu);
      // @ts-expect-error Handler param types mismatch
      codeMirror.on("gutterContextMenu", onCodeMirrorGutterContextMenu);
    } else {
      onCodeMirrorGutterContextMenu = (event: MouseEvent) => {
        openMenuHelper(event);
      };

      // @ts-expect-error Handler param types mismatch
      codeMirrorWrapper.addEventListener("contextmenu", onCodeMirrorGutterContextMenu);
    }

    // Always call once after mounting to handle initial coordinates.
    onCodeMirrorScrollDebounced();

    return () => {
      document.removeEventListener("mousemove", onDocumentMouseMove);

      // @ts-expect-error Handler param types mismatch
      codeMirror.off("contextmenu", onCodeMirrorContextMenu);
      // @ts-expect-error Unknown "gutterClick" event type
      codeMirror.off("gutterClick", onCodeMirrorGutterClick);
      // @ts-expect-error Handler param types mismatch
      codeMirror.off("gutterContextMenu", onCodeMirrorGutterContextMenu);
      codeMirror.off("scroll", onCodeMirrorScrollDebounced);

      codeMirrorWrapper.removeEventListener("click", onCodeMirrorClick);
      codeMirrorWrapper.removeEventListener("keydown", onCodeMirrorKeyDown);
      codeMirrorWrapper.removeEventListener("mouseover", onCodeMirrorMouseOverToken);
      codeMirrorWrapper.removeEventListener("mouseover", onCodeMirrorMouseOverLine);
    };
  }, [dispatch, editor, setContextMenu]);

  useHighlightedLines(editor);
  useLineHitCounts(editor);

  return editor;
}

function scrollToLocationHelper(
  editor: SourceEditor,
  prevProps: PrevProps,
  nextProps: InstanceProps
) {
  const { selectedLocation, selectedSource, selectedSourceContent, symbols } = nextProps;
  const {
    selectedLocation: prevSelectedLocation,
    selectedSourceContent: prevSelectedSourceContent,
    symbols: prevSymbols,
  } = prevProps;

  if (selectedLocation) {
    let shouldScrollToLocation = false;
    if (
      selectedSource != null &&
      selectedSourceContent != null &&
      selectedLocation?.line != null &&
      selectedSourceContent?.value != null
    ) {
      const isFirstLoad = prevSelectedSourceContent?.value == null;
      const locationChanged = prevSelectedLocation !== selectedLocation;
      const symbolsChanged = prevSymbols !== symbols;

      shouldScrollToLocation = isFirstLoad || locationChanged || symbolsChanged;
    }

    if (shouldScrollToLocation) {
      const line = toEditorLine(selectedLocation.line!);

      let column = 0;
      if (hasDocument(selectedSource!.id)) {
        const doc = getDocument(selectedSource!.id);
        const lineText = doc.getLine(line);

        column = toEditorColumn(lineText, selectedLocation.column || 0);
        column = Math.max(column, getIndentation(lineText));
      }

      scrollToColumn(editor.codeMirror, line, column);
    }
  }
}

function setTextHelper(editor: SourceEditor, instanceProps: InstanceProps): void {
  const { selectedSource, selectedSourceContent, symbols } = instanceProps;

  if (!selectedSource || !selectedSourceContent) {
    clearEditor(editor);
  } else if (!selectedSourceContent.value) {
    showLoading(editor);
  } else if (selectedSourceContent.status === LoadingStatus.ERRORED) {
    let { value } = selectedSourceContent.value;
    if (typeof value !== "string") {
      value = "Unexpected source error";
    }
    showErrorMessage(editor, value);
  } else {
    showSourceText(editor, selectedSource, selectedSourceContent.value, symbols as any);
  }
}
