import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
// eslint-disable-next-line no-restricted-imports
import { initSocket, client } from "protocol/socket";
import { useAppDispatch, useAppStore } from "ui/setup/hooks";
import { UIStore } from "ui/actions";
import { ExpectedError } from "ui/state/app";
import { onUnprocessedRegions, setAppMode } from "ui/actions/app";
import { getAccessibleRecording } from "ui/actions/session";
import tokenManager from "ui/utils/tokenManager";
import { useGetRecordingId } from "ui/hooks/recordings";
import renderSourcemap from "ui/utils/sourcemapVisualizer";
import LoadingScreen from "ui/components/shared/LoadingScreen";
import { ExpectedErrorScreen } from "ui/components/shared/Error";

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

    // find the requested source
    const result = await Promise.race([
      client.Debugger.findSources({}, sessionId),
      new Promise<{ id: string; url?: string }>(resolve => {
        client.Debugger.addNewSourceListener(newSource => {
          if (newSource.sourceId === sourceId) {
            if (newSource.generatedSourceIds?.length) {
              const url = newSource.url ? decodeURI(newSource.url) : undefined;
              resolve({ id: newSource.generatedSourceIds[0], url });
            } else {
              resolve({ id: sourceId });
            }
          }
        });
      }),
    ]);
    if (!("id" in result)) {
      return { error: "Source not found" };
    }

    // load the requested source's contents and sourcemap
    const { id: generatedSourceId, url } = result;
    const { contents: source } = await client.Debugger.getSourceContents(
      { sourceId: generatedSourceId },
      sessionId
    );
    const { contents: map } = await client.Debugger.getSourceMap(
      { sourceId: generatedSourceId },
      sessionId
    );
    return { source, map, url };
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
