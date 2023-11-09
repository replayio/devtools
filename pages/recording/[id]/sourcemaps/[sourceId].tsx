import { Source } from "@replayio/protocol";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

// eslint-disable-next-line no-restricted-imports
import { client, initSocket } from "protocol/socket";
import { assert } from "protocol/utils";
import renderSourcemap from "third-party/sourcemap-visualizer/sourcemapVisualizer";
import { UIStore } from "ui/actions";
import { setAppMode } from "ui/actions/app";
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

    const sourcesMap: Map<string, Source> = new Map();
    client.Debugger.addNewSourceListener(source => {
      sourcesMap.set(source.sourceId, source);
    });
    client.Debugger.addNewSourcesListener(({ sources }) => {
      for (const source of sources) {
        sourcesMap.set(source.sourceId, source);
      }
    });
    await client.Debugger.findSources({}, sessionId);
    let originalSource = sourcesMap.get(sourceId);
    let generatedSourceId = originalSource?.generatedSourceIds?.[0];

    if (!originalSource || !generatedSourceId) {
      return { error: "Source not found" };
    }

    let generatedSource = sourcesMap.get(generatedSourceId)!;
    assert(generatedSource, "referenced source should exist");

    // Traverse the source chain until we find the original source whose
    // generated source is *truly* a generated source. We know this because *it*
    // does not have any generated sources. So if the chain was:
    // pp1 -> o1 -> 1
    // We would stop when `originalSource` is `o1` and `generatedSource` is `1`.
    while (generatedSource.generatedSourceIds?.length) {
      originalSource = generatedSource;
      generatedSourceId = originalSource.generatedSourceIds![0];
      const newGeneratedSource = sourcesMap.get(generatedSourceId)!;
      assert(newGeneratedSource, "referenced source should exist");
      generatedSource = newGeneratedSource;
    }

    // load the requested source's contents and sourcemap
    const { url } = originalSource;
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

export default function SourceMapLoader() {
  const store = useAppStore();
  const recordingId = useGetRecordingId();
  const sourceId = useRouter().query.sourceId as string;
  const [sourcemapResult, setSourcemapResult] = useState<SourcemapResult | undefined>();
  const dispatch = useAppDispatch();

  useEffect(() => {
    document.body.className = "sourcemaps-viewer";
    dispatch(setAppMode("sourcemaps-viewer"));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  //   useEffect(() => {
  //     loadSourceMap(recordingId, sourceId, store).then(setSourcemapResult);
  //   }, [recordingId, sourceId, store]);

  //   if (!sourcemapResult) {
  //     return <LoadingScreen message="Loading source information..." />;
  //   }

  //   if ("error" in sourcemapResult) {
  //     const error: ExpectedError = {
  //       message: "Error",
  //       content: sourcemapResult.error,
  //     };
  //     return <ExpectedErrorScreen error={error} />;
  //   }
  //   if (!sourcemapResult.map) {
  //     const error: ExpectedError = {
  //       message: "No sourcemap",
  //       content: "There is no sourcemap for this source",
  //     };
  //     return <ExpectedErrorScreen error={error} />;
  //   }

  return <div>Yo</div>;
}
