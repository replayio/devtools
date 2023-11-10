import { createHash } from "crypto";
import { Source } from "@replayio/protocol";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useRef, useState } from "react";

// eslint-disable-next-line no-restricted-imports
import { client, initSocket } from "protocol/socket";
import { assert } from "protocol/utils";
import { setAppMode } from "ui/actions/app";
import { ExpectedErrorScreen } from "ui/components/shared/Error";
import LoadingScreen from "ui/components/shared/LoadingScreen";
import { useGetRecording, useGetRecordingId } from "ui/hooks/recordings";
import { useAppDispatch, useAppStore } from "ui/setup/hooks";
import { ExpectedError } from "ui/state/app";
import tokenManager from "ui/utils/tokenManager";

const sha256 = createHash("sha256");

type SourcemapsResult =
  | { sourceMaps: any[]; contents: string; generatedSource: Source }
  | {
      error: string;
    };

async function fetchSourceMaps(filename: string, workspaceId: string) {
  const sourceMapsResponse = await fetch(`/api/sourceMaps`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filename,
      workspace_id: workspaceId,
    }),
  });

  if (sourceMapsResponse.status === 500) {
    return { error: "Failed to fetch sourcemaps" };
  }

  const { sourceMaps } = (await sourceMapsResponse.json()) as any;
  return sourceMaps;
}

async function loadSourceMaps(
  recordingId: string,
  sourceId: string,
  workspaceId: string
): Promise<SourcemapsResult> {
  try {
    console.log(`loading source maps`, { recordingId, sourceId, workspaceId });
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

    if (!url) {
      return { error: "url did not exist" };
    }

    const filename = url.split("/").pop();
    if (!filename) {
      return { error: "filename could not be found" };
    }

    const sourceMaps = await fetchSourceMaps(filename, workspaceId);

    console.log(`loaded source maps:`, { sourceMaps, contents, generatedSource, originalSource });
    return { sourceMaps, contents, generatedSource };
  } catch (error: any) {
    return { error: error.message || "Failed to load sourcemap" };
  }
}

function getWorkspaceId(recording: any) {
  const workspaceId = recording.recording?.workspace.id;
  const id = atob(workspaceId).slice(2);
  return id;
}

function SourceMapList({ sourceMaps }: { sourceMaps: any[] }) {
  if (sourceMaps.length == 0) {
    return (
      <div className="text-md p-4 text-gray-800 dark:text-white">No matching source maps.</div>
    );
  }
  return (
    <div className="px-4">
      <div className="text-lg text-gray-700">Source Maps</div>
      {sourceMaps.map(sourceMap => (
        <div className="py-4" key={sourceMap.id}>
          <h2 className="text-md text-gray-800 dark:text-white">
            {"Date: "}
            {new Date(sourceMap.created_at).toLocaleDateString()}{" "}
            {new Date(sourceMap.created_at).toLocaleTimeString()}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">Group: {sourceMap.group}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            SHA-256: {sourceMap.content_hash}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function SourceMapLoader() {
  const recordingId = useGetRecordingId();
  const recording = useGetRecording(recordingId);
  const sourceId = useRouter().query.sourceId as string;
  const [sourcemapResult, setSourcemapResult] = useState<SourcemapsResult | undefined>();
  const dispatch = useAppDispatch();
  const loadedRef = useRef(false);

  useEffect(() => {
    document.body.className = "sourcemaps-viewer";
    dispatch(setAppMode("sourcemaps-viewer"));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (loadedRef.current || recording.loading || !recording.recording?.workspace) {
      return;
    }
    loadedRef.current = true;
    loadSourceMaps(recordingId, sourceId, getWorkspaceId(recording)).then(setSourcemapResult);
  }, [recordingId, sourceId, recording]);

  const contentHash = useMemo(() => {
    if (!sourcemapResult || "error" in sourcemapResult) {
      return;
    }

    sha256.update(sourcemapResult.contents);
    const contentHash = sha256.digest("hex");
    return contentHash;
  }, [sourcemapResult]);

  if (!sourcemapResult) {
    return <LoadingScreen message="Loading source information..." />;
  }

  if ("error" in sourcemapResult) {
    const error: ExpectedError = {
      message: "Error",
      content: sourcemapResult.error,
    };
    return <ExpectedErrorScreen error={error} />;
  }

  const filename = sourcemapResult.generatedSource.url?.split("/").pop();
  return (
    <div className="h-full bg-white">
      <div className="mb-8 bg-gray-200 p-4 dark:bg-gray-700">
        <h1 className="text-2xl text-gray-800 dark:text-white">Workspace source maps viewer</h1>
        <div className="mt-2">
          <p className="text-sm text-gray-600 dark:text-gray-300">Source: {filename}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            SHA-256: <span>{contentHash}</span>
          </p>
        </div>
      </div>
      <SourceMapList sourceMaps={sourcemapResult.sourceMaps} />
    </div>
  );
}
