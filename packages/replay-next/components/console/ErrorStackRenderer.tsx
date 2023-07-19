import { ObjectId, PauseId } from "@replayio/protocol";
import ErrorStackParser from "error-stack-parser";
import { ReactNode, Suspense, useContext } from "react";

import { assert } from "protocol/utils";
import Loader from "replay-next/components/Loader";
import { SourcesContext } from "replay-next/src/contexts/SourcesContext";
import { useStreamingSources } from "replay-next/src/hooks/useStreamingSources";
import { mappedLocationCache } from "replay-next/src/suspense/MappedLocationCache";
import { objectPropertyCache } from "replay-next/src/suspense/ObjectPreviews";
import { sourceOutlineCache } from "replay-next/src/suspense/SourceOutlineCache";
import { findFunctionNameForLocation, isSourceMappedSource } from "replay-next/src/utils/source";
import { getPreferredLocationWorkaround } from "replay-next/src/utils/sources";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import Source from "./Source";
import styles from "./ErrorStackRenderer.module.css";

export default function ErrorStackRenderer({
  errorObjectId,
  pauseId,
}: {
  errorObjectId: ObjectId;
  pauseId: PauseId;
}) {
  return (
    <Suspense fallback={<Loader />}>
      <div className={styles.ErrorStack} data-test-name="ErrorStack">
        <ErrorStackRendererSuspends pauseId={pauseId} errorObjectId={errorObjectId} />
      </div>
    </Suspense>
  );
}

function ErrorStackRendererSuspends({
  errorObjectId,
  pauseId,
}: {
  errorObjectId: ObjectId;
  pauseId: PauseId;
}) {
  const client = useContext(ReplayClientContext);
  const stack = objectPropertyCache.read(client, pauseId, errorObjectId, "stack")?.value;
  assert(typeof stack === "string", "no stack string found in error object");
  // Handle cases where there is no meaningful stack string;
  if (stack.trim().length === 0) {
    return <span>No stack available</span>;
  }

  const frames = ErrorStackParser.parse({ name: "", message: "", stack });
  return (
    <>
      {frames.map((frame, index) => (
        <ErrorFrameRendererSuspends key={index} frame={frame} />
      ))}
    </>
  );
}

function ErrorFrameRendererSuspends({ frame }: { frame: StackFrame }) {
  const { lineNumber, columnNumber, fileName } = frame;
  const replayClient = useContext(ReplayClientContext);
  const { preferredGeneratedSourceIds } = useContext(SourcesContext);

  const { idToSource, urlToSources } = useStreamingSources();

  let sources = fileName ? urlToSources.get(fileName) || [] : [];
  // Ignore original and pretty-printed sources because we're looking
  // for a source that the browser actually executed
  sources = sources.filter(source => !source.generated.length);

  let originalFunctionName: string | undefined = undefined;
  let renderedSource: ReactNode;
  if (sources.length >= 1 && lineNumber !== undefined && columnNumber !== undefined) {
    const location = {
      sourceId: sources[0].sourceId,
      line: lineNumber,
      column: columnNumber,
    };
    const mappedLocation = mappedLocationCache.read(replayClient, location);
    const preferredLocation = getPreferredLocationWorkaround(
      idToSource,
      preferredGeneratedSourceIds,
      mappedLocation
    );
    if (preferredLocation && isSourceMappedSource(preferredLocation.sourceId, idToSource)) {
      const sourceOutline = sourceOutlineCache.read(replayClient, preferredLocation.sourceId);
      originalFunctionName = findFunctionNameForLocation(preferredLocation, sourceOutline);
    }
    renderedSource = <Source className={styles.Source} locations={mappedLocation} />;
  } else {
    // this shouldn't happen but we provide a fallback just in case
    const sourceString = `${fileName}:${lineNumber}`;
    renderedSource = (
      <span className={styles.Source} data-test-name="Console-Source" title={sourceString}>
        {sourceString}
      </span>
    );
  }

  return (
    <div>
      at {originalFunctionName || frame.functionName || "(anonymous)"} ({renderedSource})
    </div>
  );
}
