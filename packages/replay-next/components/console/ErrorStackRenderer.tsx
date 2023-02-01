import { ObjectId, PauseId } from "@replayio/protocol";
import ErrorStackParser from "error-stack-parser";
import { ReactNode, Suspense, useContext } from "react";

import { assert } from "protocol/utils";
import Loader from "replay-next/components/Loader";
import { getMappedLocationSuspense } from "replay-next/src/suspense/MappedLocationCache";
import { getObjectPropertySuspense } from "replay-next/src/suspense/ObjectPreviews";
import { getScopeMapSuspense } from "replay-next/src/suspense/ScopeMapCache";
import { getSourcesByUrlSuspense } from "replay-next/src/suspense/SourcesCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import Source from "./Source";
import styles from "./StackRenderer.module.css";

export default function ErrorStackRenderer({
  pauseId,
  errorObjectId,
}: {
  pauseId: PauseId;
  errorObjectId: ObjectId;
}) {
  return (
    <Suspense fallback={<Loader />}>
      <div className={styles.StackGrid} data-test-name="ErrorStack">
        <ErrorStackRendererSuspends pauseId={pauseId} errorObjectId={errorObjectId} />
      </div>
    </Suspense>
  );
}

function ErrorStackRendererSuspends({
  pauseId,
  errorObjectId,
}: {
  pauseId: PauseId;
  errorObjectId: ObjectId;
}) {
  const client = useContext(ReplayClientContext);
  const stack = getObjectPropertySuspense(client, pauseId, errorObjectId, "stack").value;
  assert(typeof stack === "string", "no stack string found in error object");
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
    const mappedLocation = getMappedLocationSuspense(client, location);
    const scopeMap = getScopeMapSuspense(client, location);
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
    <>
      <span>{originalFunctionName || frame.functionName || "(anonymous)"}</span>
      <span>@</span>
      <span className={styles.SourceColumn}>{renderedSource}</span>
    </>
  );
}
