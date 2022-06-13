import { skipToken } from "@reduxjs/toolkit/dist/query";
import { useGetSourceTextQuery, useGetSourceHitCountsQuery } from "../../app/api";
import { useAppSelector } from "../../app/hooks";

export const SourceContent = () => {
  const selectedSourceId = useAppSelector(state => state.sources.selectedSourceId);

  const { data: sourceText } = useGetSourceTextQuery(selectedSourceId ?? skipToken);
  const { data: sourceHits } = useGetSourceHitCountsQuery(selectedSourceId ?? skipToken);

  if (!selectedSourceId) {
    return null;
  }

  return <pre style={{ maxHeight: 600, overflowY: "auto", minWidth: 800 }}>{sourceText}</pre>;
};
