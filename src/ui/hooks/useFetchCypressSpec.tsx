import { useContext, useState, useEffect } from "react";
import { useAppSelector } from "ui/setup/hooks";
import { useGetRecording, useGetRecordingId } from "ui/hooks/recordings";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { getAllSourceDetails, getSourcesLoading } from "ui/reducers/sources";
import { SourceLocation, SearchSourceContentsMatch } from "@replayio/protocol";

export type CypressResult = {
  test: string;
  location: SourceLocation;
};

export function useFetchCypressSpec() {
  const recordingId = useGetRecordingId();
  const { recording } = useGetRecording(recordingId);
  const sourceList = useAppSelector(getAllSourceDetails);
  const sourcesLoading = useAppSelector(getSourcesLoading);
  const [results, setResults] = useState<CypressResult[] | null>(null);

  const client = useContext(ReplayClientContext);
  useEffect(() => {
    (async () => {
      if (!recording || sourcesLoading) {
        return;
      }
      const file = recording.metadata?.test?.file;
      if (!file) {
        return;
      }

      const sources = sourceList.filter(source => source.url?.includes(file));

      // If the recording does not include sourcemaps
      // then it likely wont be able to find the spec file
      if (sources.length === 0) {
        return;
      }

      const preferredSourceId = sources[sources.length - 1].id;

      const results: SearchSourceContentsMatch[] = [];
      await client.searchSources({ query: " it(", sourceIds: [preferredSourceId] }, res =>
        results.push(...res)
      );

      const matches: CypressResult[] = results.map(r => {
        const match = r.context.match(/(\"|\')(.*)(\"|\')/);
        return { test: match?.[2] || "", location: r.location };
      });

      setResults(matches);
    })();
  }, [client, sourceList, sourcesLoading, recording]);

  return results;
}
