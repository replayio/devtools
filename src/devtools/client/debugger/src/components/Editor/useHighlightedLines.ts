import range from "lodash/range";
import isEmpty from "lodash/isEmpty";
import { useLayoutEffect, useRef } from "react";
import {
  getSelectedLocation,
  getSelectedSourceWithContent,
  SourceContent,
} from "ui/reducers/sources";
import { useAppSelector } from "ui/setup/hooks";
import {
  getHighlightedLineRange,
  getVisibleSelectedFrame,
  HighlightedRange,
} from "../../selectors";
import SourceEditor from "../../utils/editor/source-editor";
import { toEditorLine, endOperation, startOperation } from "../../utils/editor";
import { PartialLocation } from "../../actions/sources";
import { TempFrame } from "../../actions/pause/selectFrame";
import { getDocument, hasDocument } from "../../utils/editor/source-documents";
import { Doc } from "codemirror";

type PrevProps = {
  editorLine: number | null;
  highlightedLineRange: HighlightedRange | null;
  selectedLocation: PartialLocation | null;
  selectedSource: SourceContent | null;
};

// This hook combines legacy HighlightLine and HighlightLines "headless" components.
export default function useHighlightedLines(editor: SourceEditor | null) {
  const selectedFrame = useAppSelector(getVisibleSelectedFrame);
  const selectedLocation = useAppSelector(getSelectedLocation);
  const selectedSource = useAppSelector(getSelectedSourceWithContent) || null;
  const highlightedLineRange = useAppSelector(getHighlightedLineRange) || null;

  const prevPropsRef = useRef<PrevProps>({
    editorLine: null,
    highlightedLineRange: null,
    selectedLocation: null,
    selectedSource: null,
  });

  // Update highlighted line when selected location changes
  useLayoutEffect(() => {
    if (editor === null) {
      // TODO Document why this is okay.
      return;
    }

    const prevProps = prevPropsRef.current;

    const editorLine = selectedLocation?.line ? toEditorLine(selectedLocation.line) : null;
    const prevEditorLine = prevProps.selectedLocation?.line
      ? toEditorLine(prevProps.selectedLocation.line)
      : null;
    if (editorLine !== prevEditorLine) {
      return;
    }

    startOperation();

    // Clear highlighted for previous line
    if (prevEditorLine !== null) {
      if (isDocumentReady(prevProps.selectedSource, prevProps.selectedLocation!)) {
        const { sourceId: prevSourceId } = prevProps.selectedLocation!;
        const doc = getDocument(prevSourceId);

        // @ts-expect-error method doesn't exist
        doc.removeLineClass(prevEditorLine, "line", "highlight-line");
      }
    }

    // Highlight new line
    if (editorLine) {
      const { line, sourceId } = selectedLocation!;
      if (shouldSetHighlightLine(selectedLocation!, selectedSource, prevProps.editorLine)) {
        if (line != null && isDebugLine(selectedFrame as any as TempFrame, selectedLocation!)) {
          const doc = getDocument(sourceId);
          // @ts-expect-error method doesn't exist
          doc.addLineClass(editorLine, "line", "highlight-line");
          resetHighlightLine(doc, editorLine);
        }
      }
    }

    endOperation();

    // Update prev props for next render
    prevProps.editorLine = editorLine;
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

function isDebugLine(selectedFrame: TempFrame | null, selectedLocation: PartialLocation) {
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

function resetHighlightLine(doc: Doc | null, editorLine: number) {
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
      doc.removeLineClass(editorLine, "line", "highlight-line");
    }, duration);
  }
}

function shouldSetHighlightLine(
  selectedLocation: PartialLocation,
  selectedSource: SourceContent | null,
  previousEditorLine: number | null
) {
  const { line } = selectedLocation;
  if (!isDocumentReady(selectedSource, selectedLocation)) {
    return false;
  } else if (toEditorLine(line) === previousEditorLine) {
    return false;
  } else {
    return true;
  }
}
