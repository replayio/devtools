// import loader from "@monaco-editor/loader";
import * as monacoEditor from "monaco-editor/esm/vs/editor/editor.api";
// import { wireTmGrammars } from "monaco-editor-textmate";
// import { Registry } from "monaco-textmate";
// import { loadWASM } from "onigasm";
// import type { AsyncReturnType } from "type-fest";

// import theme from "./theme.json";

// import defineTheme from "./define-theme";

export type Monaco = typeof monacoEditor;

export type InitializeMonacoOptions = {
  container: HTMLElement;
  monaco: Monaco;
  defaultValue?: string;
  id?: number;
  lineNumbers?: any;
  fontSize?: number;
  onOpenEditor?: (input: any, source: any) => void;
};

export async function initializeMonaco({
  container,
  monaco,
  defaultValue = "",
  id = 0,
  lineNumbers,
  fontSize = 14,
  onOpenEditor = () => null,
}: InitializeMonacoOptions) {
  // try {
  //   await loadWASM("/onigasm.wasm");
  // } catch {
  //   // try/catch prevents onigasm from erroring on fast refreshes
  // }

  // const registry = new Registry({
  //   getGrammarDefinition: async (scopeName: any) => {
  //     switch (scopeName) {
  //       case "source.tsx":
  //         return {
  //           format: "json",
  //           content: await (await fetch("/tsx.tmLanguage.json")).text(),
  //         };
  //       default:
  //         return null;
  //     }
  //   },
  // });

  // const grammars = new Map();

  // grammars.set("typescript", "source.tsx");

  const model = monaco.editor.createModel(
    defaultValue,
    "typescript",
    monaco.Uri.parse(`file:///index-${id}.tsx`)
  );

  const editor = monaco.editor.create(container, {
    model,
    fontSize,
    lineNumbers,
    folding: false,
    readOnly: true,
    fontFamily: "var(--font-family-mono)",
    automaticLayout: true,
    language: "typescript",
    contextmenu: false,
    theme: "vs-light",
    formatOnPaste: true,
    formatOnType: true,
    minimap: { enabled: false },
  });

  /** Example of injecting a view zone */
  const lineNumber = 5;

  editor.changeViewZones(changeAccessor => {
    var domNode = document.createElement("div");

    changeAccessor.addZone({
      afterLineNumber: lineNumber,
      heightInLines: 3,
      domNode: domNode,
    });

    /** Inject Print Statement Panel here */
    domNode.style.background = "#ccc";
  });

  /** Prevent editor from being focused (more aggressive read-only mode) */
  editor.onDidFocusEditorText(() => {
    (document.activeElement as HTMLElement)?.blur();
  });

  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    jsx: monaco.languages.typescript.JsxEmit.Preserve,
    esModuleInterop: true,
  });

  /**
   * Load React types
   * alternatively, you can use: https://github.com/lukasbach/monaco-editor-auto-typings
   */
  fetch("https://unpkg.com/@types/react@17.0.38/index.d.ts")
    .then(response => response.text())
    .then(types => {
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        types,
        "file:///node_modules/react/index.d.ts"
      );
    });

  /** Convert VS Code theme to Monaco theme */
  // defineTheme(monaco, theme);

  // await wireTmGrammars(monaco, registry, grammars);

  return editor;
}
