import { Doc } from "codemirror";
import isEmpty from "lodash/isEmpty";
import range from "lodash/range";
import { useLayoutEffect, useRef } from "react";

import { PartialLocation } from "devtools/client/debugger/src/actions/sources";
import {
  HighlightedRange,
  PauseFrame,
  getHighlightedLineRange,
  getSelectedFrameSuspense,
} from "devtools/client/debugger/src/selectors";
import { endOperation, startOperation } from "devtools/client/debugger/src/utils/editor";
import {
  getDocument,
  hasDocument,
} from "devtools/client/debugger/src/utils/editor/source-documents";
import SourceEditor from "devtools/client/debugger/src/utils/editor/source-editor";
import {
  SourceContent,
  getSelectedLocation,
  getSelectedSourceWithContent,
} from "ui/reducers/sources";
import { useAppSelector } from "ui/setup/hooks";

type PrevProps = {
  highlightedLineRange: HighlightedRange | null;
  lineIndex: number | null;
  selectedLocation: PartialLocation | null;
  selectedSource: SourceContent | null;
};

// This hook combines legacy HighlightLine and HighlightLines "headless" components.
export default function useHighlightedLines(editor: SourceEditor | null) {
  const selectedFrame = useAppSelector(getSelectedFrameSuspense);
  const selectedLocation = useAppSelector(getSelectedLocation);
  const selectedSource = useAppSelector(getSelectedSourceWithContent) || null;
  const highlightedLineRange = useAppSelector(getHighlightedLineRange) || null;

  const prevPropsRef = useRef<PrevProps>({
    highlightedLineRange: null,
    lineIndex: null,
    selectedLocation: null,
    selectedSource: null,
  });

  // Update highlighted line when selected location changes
  useLayoutEffect(() => {
    if (editor === null) {
      // This hook only uses prev props when there's an Editor.
      // If the hook is called without an Editor (as part of mounting/remounting) we can bail out early.
      return;
    }

    const prevProps = prevPropsRef.current;

    const lineIndex = selectedLocation?.line ? selectedLocation.line - 1 : null;
    const prevLineIndex = prevProps.selectedLocation?.line
      ? prevProps.selectedLocation.line - 1
      : null;
    if (lineIndex !== prevLineIndex) {
      return;
    }

    startOperation();

    // Clear highlighted for previous line
    if (prevLineIndex != null) {
      if (isDocumentReady(prevProps.selectedSource, prevProps.selectedLocation!)) {
        const { sourceId: prevSourceId } = prevProps.selectedLocation!;
        const doc = getDocument(prevSourceId);

        // @ts-expect-error method doesn't exist
        doc.removeLineClass(prevLineIndex, "line", "highlight-line");
      }
    }

    // Highlight new line
    if (lineIndex != null && selectedLocation != null) {
      const { sourceId } = selectedLocation;
      if (
        shouldSetHighlightLine(selectedSource, selectedLocation, lineIndex, prevProps.lineIndex)
      ) {
        if (isDebugLine(selectedFrame, selectedLocation!)) {
          const doc = getDocument(sourceId);
          // @ts-expect-error method doesn't exist
          doc.addLineClass(lineIndex, "line", "highlight-line");
          resetHighlightLine(doc, lineIndex);
        }
      }
    }

    endOperation();

    // Update prev props for next render
    prevProps.lineIndex = lineIndex;
    prevProps.selectedLocation = selectedLocation;
    prevProps.selectedSource = selectedSource;
  }, [editor, selectedFrame, selectedLocation, selectedSource]);

  // Update highlighted line range when selected location changes
  useLayoutEffect(() => {
    if (!editor) {
      return;
    }

    const { codeMirror } = editor;
    const { highlightedLineRange: prevHighlightedLineRange } = prevPropsRef.current;

    // Clear previously highlighted line range
    if (prevHighlightedLineRange !== null && isEmpty(prevHighlightedLineRange)) {
      const { start, end } = prevHighlightedLineRange;
      codeMirror.operation(() => {
        range(start! - 1, end).forEach(line => {
          codeMirror.removeLineClass(line, "line", "highlight-lines");
        });
      });
    }

    // Highlight new line range
    if (highlightedLineRange !== null && !isEmpty(highlightedLineRange)) {
      const { start, end } = highlightedLineRange;
      codeMirror.operation(() => {
        editor.alignLine(start!);
        range(start! - 1, end).forEach(line => {
          codeMirror.addLineClass(line, "line", "highlight-lines");
        });
      });
    }

    // Update prev props for next render
    prevPropsRef.current.highlightedLineRange = highlightedLineRange;
  }, [editor, highlightedLineRange]);
}

function isDebugLine(selectedFrame: PauseFrame | null, selectedLocation: PartialLocation) {
  if (!selectedFrame) {
    return;
  }

  return (
    selectedLocation &&
    selectedFrame.location.sourceId == selectedLocation.sourceId &&
    selectedFrame.location.line == selectedLocation.line
  );
}

function isDocumentReady(
  selectedSource?: SourceContent | null,
  selectedLocation?: PartialLocation
) {
  return (
    selectedLocation &&
    selectedSource &&
    selectedSource.value &&
    hasDocument(selectedLocation.sourceId)
  );
}

function resetHighlightLine(doc: Doc | null, lineIndex: number) {
  const editorWrapper = document.querySelector(".editor-wrapper");
  if (editorWrapper === null) {
    return;
  }

  const duration = parseInt(
    getComputedStyle(editorWrapper).getPropertyValue("--highlight-line-duration"),
    10
  );

  if (doc) {
    setTimeout(() => {
      // @ts-ignore
      doc.removeLineClass(lineIndex, "line", "highlight-line");
    }, duration);
  }
}

function shouldSetHighlightLine(
  selectedSource: SourceContent | null,
  selectedLocation: PartialLocation,
  lineIndex: number | null,
  prevLineIndex: number | null
) {
  if (!isDocumentReady(selectedSource, selectedLocation)) {
    return false;
  } else if (lineIndex === prevLineIndex) {
    return false;
  } else {
    return true;
  }
}
