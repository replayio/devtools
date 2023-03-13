import { ObjectId, PauseId } from "@replayio/protocol";
import ErrorStackParser from "error-stack-parser";
import { ReactNode, Suspense, useContext } from "react";

import { assert } from "protocol/utils";
import Loader from "replay-next/components/Loader";
import { getMappedLocationSuspense } from "replay-next/src/suspense/MappedLocationCache";
import { objectPropertyCache } from "replay-next/src/suspense/ObjectPreviews";
import { getScopeMapSuspense } from "replay-next/src/suspense/ScopeMapCache";
import { getSourcesByUrlSuspense } from "replay-next/src/suspense/SourcesCache";
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
  const client = useContext(ReplayClientContext);

  const sourcesByUrl = getSourcesByUrlSuspense(client);
  let sources = fileName ? sourcesByUrl.get(fileName) || [] : [];
  // Ignore original and pretty-printed sources because we're looking
  // for a source that the browser actually executed
  sources = sources.filter(source => !source.generatedSourceIds?.length);

  let originalFunctionName: string | undefined = undefined;
  let renderedSource: ReactNode;
  if (sources.length >= 1 && lineNumber !== undefined && columnNumber !== undefined) {
    const location = {
      sourceId: sources[0].sourceId,
      line: lineNumber,
      column: columnNumber,
    };
    const mappedLocation = getMappedLocationSuspense(location, client);
    const scopeMap = getScopeMapSuspense(location, client);
    originalFunctionName = scopeMap?.find(mapping => mapping[0] === frame.functionName)?.[1];
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
