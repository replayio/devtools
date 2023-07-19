import { useContext } from "react";
import { useStreamingValue } from "suspense";

import { SourcesCacheValue, sourcesCache } from "replay-next/src/suspense/SourcesCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

export function useStreamingSources(): SourcesCacheValue {
  const replayClient = useContext(ReplayClientContext);
  const { value: { idToSource = new Map(), sources = [], urlToSources = new Map() } = {} } =
    useStreamingValue(sourcesCache.stream(replayClient));

  return { idToSource, sources, urlToSources };
}
