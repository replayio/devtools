import { useRouter } from "next/router";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { initSocket, client } from "protocol/socket";
import { useDispatch, useStore } from "react-redux";
import { UIStore } from "ui/actions";
import { ExpectedError } from "ui/state/app";
import { onUnprocessedRegions, setAppMode } from "ui/actions/app";
import { getAccessibleRecording, showLoadingProgress } from "ui/actions/session";
import tokenManager from "ui/utils/tokenManager";
import { useGetRecordingId } from "ui/hooks/recordings";
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
    initSocket(store, dispatchUrl);
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
    store.dispatch(showLoadingProgress());

    // or use the annotations provider component
    const annotations = await client.Session.getAnnotations();

    return { annotations };
  } catch (error: any) {
    return { error: error.message || "Failed to load annotations" };
  }
}

function ReduxDevTools({
  source,
  map,
  url,
}: {
  source: string;
  map: string;
  url: string | undefined;
}) {
  const dispatch = useDispatch();
  const [ReduxDevToolsAppRoot, setRoot] = useState<typeof Root | null>(null);
  const rootRef = useRef<Root | null>(null);
  const reduxAnnotations = useContext(ReduxAnnotationsContext);

  // TODO [hbenl] Fix react-hooks/exhaustive-deps
  // Is this really something we only want to do on-mount (even if source/map/url change)?
  useEffect(() => {
    document.body.className = "redux-devtools";
    dispatch(setAppMode("redux-devtools"));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
    const store = rootRef.current.store!;

    const colorPreference = replayThemesToRDTThemes[appTheme];

    store.dispatch({
      type: "main/CHANGE_THEME",
      theme: "default",
      scheme: "default",
      colorPreference,
    });

    // HACK The RDT store overwrites our initial dispatch when it reloads its own persisted prefs.
    // By subscribing to the store, diffing that value, and setting React state,
    // we can loop back through here and re-dispatch based on the Replay theme,
    // thus effectively keeping them in sync.
    // We unsubscribe and resubscribe every time to avoid leaks.
    return store.subscribe(() => {
      const updatedRDTTheme = store.getState().theme.colorPreference;
      if (currentRDTTheme !== updatedRDTTheme) {
        setCurrentRDTTheme(updatedRDTTheme);
      }
    });
  }, [ReduxDevToolsAppRoot, appTheme, currentRDTTheme]);

  useLayoutEffect(() => {
    if (!rootRef.current) {
      return;
    }

    const rootComponent = rootRef.current;
    const store = rootComponent.store!;

    const matchingAnnotationsByTimeRange = reduxAnnotations.filter(annotation => {
      return currentTimestamp != null && annotation.time < currentTimestamp;
    });

    if (!matchingAnnotationsByTimeRange.length) {
      return;
    }

    batch(() => {
      // TODO THIS IS A TERRIBLE IDEA COME UP WITH SOMETHING BETTER AND YET THIS WORKS
      // Seemingly reset the DevTools internal knowledge of actions,
      // so we can re-send in all actions up to this point in the recording
      store.dispatch({
        type: "devTools/UPDATE_STATE",
        request: {
          type: "LIFTED",
          id: "default",
        },
      });

      // TODO Is this how we want to actually behave here?
      // Update the store with the actions up to this point in time
      matchingAnnotationsByTimeRange.forEach(annotation => {
        store.dispatch(annotation.action);
      });
    });

    // TODO This only gets updated when we actually _pause_, not during playback.
  }, [ReduxDevToolsAppRoot, currentTimestamp, reduxAnnotations]);

  if (!ReduxDevToolsAppRoot) {
    return null;
  }

  // @ts-ignore Weird ref type error
  return <ReduxDevToolsAppRoot ref={rootRef} />;
}

export default function SourceMapLoader() {
  const store = useStore();
  const recordingId = useGetRecordingId();
  const sourceId = useRouter().query.sourceId as string;
  const [sourcemapResult, setSourcemapResult] = useState<SourcemapResult | undefined>();

  useEffect(() => {
    loadSourceMap(recordingId, sourceId, store).then(setSourcemapResult);
  }, [recordingId, sourceId, store]);

  if (!sourcemapResult) {
    return <LoadingScreen />;
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
