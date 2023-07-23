// MonacoEditorComponent.tsx

import Editor, { Monaco, useMonaco } from "@monaco-editor/react";
import React, { useEffect, useRef } from "react";

export const MonacoEditor = ({ defaultValue = "", onChange = (value: string) => {} }) => {
  return (
    <Editor
      height="100%"
      width="100%"
      theme="vs-dark"
      options={{
        fontSize: 15,
        lineHeight: 22,
        minimap: {
          enabled: false,
        },
      }}
      onChange={onChange}
      defaultLanguage="javascript"
      defaultValue={defaultValue}
    />
  );
};
