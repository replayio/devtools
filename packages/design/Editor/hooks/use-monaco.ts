// modified from: https://github.com/suren-atoyan/monaco-react/blob/master/src/Editor/Editor.js
import * as React from "react";
import loader from "@monaco-editor/loader";

import { initializeMonaco } from "../utils/initialize-monaco";
import type { Monaco } from "../utils/initialize-monaco";

export type MonacoOptions = {
  containerRef: React.RefObject<HTMLElement>;
  value?: string;
  id?: number;
  lineNumbers?: any;
  fontSize?: number;
  focusRange?: { column: number; lineNumber: number };
  onChange?: (value: string) => void;
  onMount?: () => void;
};

export function useMonaco({
  containerRef,
  value,
  id,
  lineNumbers,
  fontSize,
  focusRange,
  onChange,
  onMount,
}: MonacoOptions) {
  const [isMounting, setIsMounting] = React.useState(true);
  const monacoRef = React.useRef<Monaco | null>(null);
  const editorRef = React.useRef<ReturnType<Monaco["editor"]["create"]> | null>(null);

  React.useEffect(() => {
    const cancelable = loader.init();

    cancelable
      .then(async (monaco: any) => {
        monacoRef.current = monaco;
        editorRef.current = await initializeMonaco({
          container: containerRef.current!,
          monaco,
          defaultValue: value,
          id,
          lineNumbers,
          fontSize,
        });
        if (onMount) {
          /**
           * Add delay to account for loading grammars
           * TODO: look into basing on actual grammar loading time
           */
          setTimeout(() => {
            onMount();
          }, 300);
        }
        setIsMounting(false);
      })
      .catch((error: any) => {
        if (error?.type !== "cancelation") {
          console.error("Monaco initialization: error:", error);
        }
      });

    return () => {
      if (editorRef.current) {
        editorRef.current.getModel()?.dispose();
        editorRef.current.dispose();
      } else {
        cancelable.cancel();
      }
    };
  }, [containerRef, id, lineNumbers, fontSize, onMount, value]);

  /** Focus the editor on mount. */
  React.useEffect(() => {
    if (isMounting || editorRef.current === null) {
      return;
    }

    editorRef.current.focus();

    if (focusRange) {
      editorRef.current.setPosition(focusRange);
    }
  }, [isMounting, focusRange]);

  React.useEffect(() => {
    if (isMounting || editorRef.current === null) {
      return;
    }

    const handleChange = editorRef.current.onDidChangeModelContent(() => {
      if (editorRef.current) {
        onChange?.(editorRef.current.getValue());
      }
    });

    return () => handleChange.dispose();
  }, [isMounting, onChange]);

  React.useEffect(() => {
    if (isMounting || editorRef.current === null) {
      return;
    }

    const handleKeyDown = editorRef.current.onKeyDown(async (event: any) => {
      /** Format file on save (metaKey + s) */
      if (event.keyCode === 49 && event.metaKey) {
        event.preventDefault();

        if (editorRef.current) {
          editorRef.current.getAction("editor.action.formatDocument").run();
        }
      }
    });

    return () => handleKeyDown.dispose();
  }, [isMounting]);

  React.useEffect(() => {
    if (editorRef.current && editorRef.current.getValue() !== value && value !== undefined) {
      const currentModel = editorRef.current.getModel();
      if (currentModel) {
        editorRef.current.executeEdits("", [
          {
            range: currentModel.getFullModelRange(),
            text: value,
            forceMoveMarkers: true,
          },
        ]);
        editorRef.current.pushUndoStop();
      } else {
        editorRef.current.setValue(value);
      }
    }
  }, [value]);
}
