import { skipToken } from "@reduxjs/toolkit/dist/query";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";

import { useGetSourceTextQuery, useGetSourceHitCountsQuery } from "../../app/api";
import { useAppSelector } from "../../app/hooks";

export const SourceContent = () => {
  const selectedSourceId = useAppSelector(state => state.sources.selectedSourceId);

  const { data: sourceText } = useGetSourceTextQuery(selectedSourceId ?? skipToken);
  const { data: sourceHits } = useGetSourceHitCountsQuery(selectedSourceId ?? skipToken);

  if (!selectedSourceId) {
    return null;
  }

  return (
    <CodeMirror
      value={sourceText}
      editable={false}
      style={{ maxHeight: 600, overflowY: "auto", minWidth: 800, maxWidth: 1000 }}
      extensions={[javascript({ jsx: true })]}
    />
  );
};
