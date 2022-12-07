import { newSource } from "@replayio/protocol";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

// eslint-disable-next-line no-restricted-imports
import { client, initSocket } from "protocol/socket";
import renderSourcemap from "third-party/sourcemap-visualizer/sourcemapVisualizer";
import { UIStore } from "ui/actions";
import { onUnprocessedRegions, setAppMode } from "ui/actions/app";
import { getAccessibleRecording } from "ui/actions/session";
import { ExpectedErrorScreen } from "ui/components/shared/Error";
import LoadingScreen from "ui/components/shared/LoadingScreen";
import { useGetRecordingId } from "ui/hooks/recordings";
import { useAppDispatch, useAppStore } from "ui/setup/hooks";
import { ExpectedError } from "ui/state/app";
import tokenManager from "ui/utils/tokenManager";

type SourcemapResult =
  | {
      source: string;
      map: string | undefined;
      url: string | undefined;
    }
  | {
      error: string;
    };

async function loadSourceMap(
  recordingId: string,
  sourceId: string,
  store: UIStore
): Promise<SourcemapResult> {
  try {
    const recording = await store.dispatch(getAccessibleRecording(recordingId));
    if (!recording) {
      return { error: "The recording is not accessible" };
    }

    const dispatchUrl =
      new URL(location.href).searchParams.get("dispatch") || process.env.NEXT_PUBLIC_DISPATCH_URL!;

    const socket = initSocket(dispatchUrl);
    if (typeof window !== "undefined") {
      if (window.app != null) {
        // @ts-ignore
        window.app.socket = socket;
      }
    }

    const token = await tokenManager.getToken();
    if (token.token) {
      await client.Authentication.setAccessToken({ accessToken: token.token });
    }
    const { sessionId } = await client.Recording.createSession({ recordingId });

    // this will show a progress bar in the LoadingScreen, note that the
    // sourcemap visualizer is shown as soon as the requested source and its sourcemap
    // have been loaded, which may happen before the progress bar reaches 100%
    client.Session.ensureProcessed({ level: "basic" }, sessionId);
    client.Session.addUnprocessedRegionsListener(regions =>
      store.dispatch(onUnprocessedRegions(regions))
    );

    const sources: Map<string, newSource> = new Map();
    client.Debugger.addNewSourceListener(newSource => {
      sources.set(newSource.sourceId, newSource);
    });
    await client.Debugger.findSources({}, sessionId);
    let source = sources.get(sourceId);
    let generatedSourceId = sourceId;
    while (source?.generatedSourceIds?.length) {
      generatedSourceId = source.generatedSourceIds[0];
      source = sources.get(generatedSourceId);
    }
    if (!source) {
      return { error: "Source not found" };
    }

    // load the requested source's contents and sourcemap
    const { url } = source;
    const { contents } = await client.Debugger.getSourceContents(
      { sourceId: generatedSourceId },
      sessionId
    );
    const { contents: map } = await client.Debugger.getSourceMap(
      { sourceId: generatedSourceId },
      sessionId
    );
    return { source: contents, map, url };
  } catch (error: any) {
    return { error: error.message || "Failed to load sourcemap" };
  }
}

function SourcemapVisualizer({
  source,
  map,
  url,
}: {
  source: string;
  map: string;
  url: string | undefined;
}) {
  const dispatch = useAppDispatch();

  // TODO [hbenl] Fix react-hooks/exhaustive-deps
  // Is this really something we only want to do on-mount (even if source/map/url change)?
  useEffect(() => {
    document.body.className = "sourcemap-visualizer";
    dispatch(setAppMode("sourcemap-visualizer"));
    renderSourcemap(source, map, url, document);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div id="toolbar">
        <div id="fileListParent">
          <select id="fileList"></select>
        </div>
      </div>
      <div id="statusBar">
        <section>
          <div id="originalStatus"></div>
        </section>
        <section>
          <div id="generatedStatus"></div>
        </section>
      </div>
    </>
  );
}

export default function SourceMapLoader() {
  const store = useAppStore();
  const recordingId = useGetRecordingId();
  const sourceId = useRouter().query.sourceId as string;
  const [sourcemapResult, setSourcemapResult] = useState<SourcemapResult | undefined>();

  useEffect(() => {
    loadSourceMap(recordingId, sourceId, store).then(setSourcemapResult);
  }, [recordingId, sourceId, store]);

  if (!sourcemapResult) {
    return <LoadingScreen fallbackMessage="Loading source information..." />;
  }

  if ("error" in sourcemapResult) {
    const error: ExpectedError = {
      message: "Error",
      content: sourcemapResult.error,
    };
    return <ExpectedErrorScreen error={error} />;
  }
  if (!sourcemapResult.map) {
    const error: ExpectedError = {
      message: "No sourcemap",
      content: "There is no sourcemap for this source",
    };
    return <ExpectedErrorScreen error={error} />;
  }

  return (
    <SourcemapVisualizer
      source={sourcemapResult.source}
      map={sourcemapResult.map}
      url={sourcemapResult.url}
    />
  );
}
