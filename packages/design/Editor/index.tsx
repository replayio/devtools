import * as React from "react";
import * as monaco from "monaco-editor";
import MonacoEditor from "@monaco-editor/react";

const lineHeight = 20;

/** Example of injecting full width content on an arbitrary line in Monaco Editor */
export function Editor({
  defaultValue,
  lineHitCounts,
}: {
  defaultValue: string;
  lineHitCounts?: Array<[lineNumber: number, hitCounts: number]>;
}) {
  /** Using a simple variable for an example line number to inject the widget in. */
  const targetLineNumber = 5;
  const heightInLines = 3;
  const editorOptions = {
    lineHeight,
    fontFamily: "var(--font-family-mono)",
    fontSize: 14,
    folding: false,
    readOnly: true,
    automaticLayout: true,
    contextmenu: false,
    theme: "vs-light",
    formatOnPaste: true,
    formatOnType: true,
    minimap: { enabled: false },
    /**
     * Lines that render content widgets need to set a height otherwise the widget will disappear too soon:
     * https://github.com/microsoft/monaco-editor/issues/2520
     */
    lineNumbers: lineNumber => {
      if (lineNumber === targetLineNumber) {
        return `<div style="height: ${lineHeight * (heightInLines + 1)}px">${lineNumber}</div>`;
      }

      return lineNumber.toString();
    },
  } as monaco.editor.IStandaloneEditorConstructionOptions;

  const handleMount = React.useCallback((editor: monaco.editor.IStandaloneCodeEditor) => {
    /** Create a view zone to give the line enough space for the content widget. */
    editor.changeViewZones(changeAccessor => {
      var domNode = document.createElement("div");

      changeAccessor.addZone({
        heightInLines,
        afterLineNumber: targetLineNumber,
        domNode: domNode,
      });
    });

    /** Now we can add the content widget to the line and fill the view zone space. */
    const widgetHeight = lineHeight * heightInLines;
    let domNode: HTMLDivElement;

    editor.addContentWidget({
      getId: function () {
        return `print-statement-panel-widget-${targetLineNumber}`;
      },
      getDomNode: function () {
        if (!domNode) {
          domNode = document.createElement("div");
          domNode.innerHTML = `
          <div style="width: 100vw; height: ${widgetHeight}px; padding: 1rem; background: #ccc;">
            <input type="text" style="font-size: 0.8rem; line-height: 1; padding: 0.1125rem">
          </div>`;
        }

        return domNode;
      },
      getPosition: function () {
        return {
          position: {
            lineNumber: targetLineNumber,
            column: 0,
          },
          preference: [monaco.editor.ContentWidgetPositionPreference.BELOW],
        };
      },
    });
  }, []);

  return (
    <MonacoEditor
      height="90vh"
      defaultLanguage="typescript"
      defaultValue={defaultValue}
      options={editorOptions}
      onMount={handleMount}
    />
  );
}
