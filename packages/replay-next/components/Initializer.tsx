// This file is not really part of the architectural demo.
// It's just a bootstrap for things like auth that I didn't want to spend time actually implementing.

import { loadedRegions as LoadedRegions } from "@replayio/protocol";
import { ReactNode, useContext, useEffect, useRef, useState } from "react";

import { CONSOLE_SETTINGS_DATABASE } from "replay-next/src/contexts/ConsoleFiltersContext";
import { POINTS_DATABASE } from "replay-next/src/contexts/PointsContext";
import { preloadIDBInitialValues } from "replay-next/src/hooks/useIndexedDB";
import { preCacheExecutionPointForTime } from "replay-next/src/suspense/ExecutionPointsCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { UserInfo } from "shared/graphql/types";
import { getCurrentUserInfo } from "shared/graphql/User";

import { SessionContext, SessionContextType } from "../src/contexts/SessionContext";
import { preCacheSources } from "../src/suspense/SourcesCache";
import Loader from "./Loader";
import styles from "./Initializer.module.css";

// HACK Hack around the fact that the initSocket() function is side effectful
// and writes to an "app" global on the window object.
if (typeof window !== "undefined") {
  (window as any).app = {
    prefs: {},
  };
}

const IDB_PREFS_DATABASES = [CONSOLE_SETTINGS_DATABASE, POINTS_DATABASE];

export default function Initializer({
  accessToken = null,
  children,
  recordingId = null,
}: {
  accessToken?: string | null;
  children: ReactNode;
  recordingId?: string | null;
}) {
  const client = useContext(ReplayClientContext);
  const [context, setContext] = useState<SessionContextType | null>(null);
  const didInitializeRef = useRef<boolean>(false);

  useEffect(() => {
    // The WebSocket and session/authentication are global.
    // We only need to initialize them once.
    if (!didInitializeRef.current) {
      const asyncInitialize = async () => {
        // Read some of the hard-coded values from query params.
        // (This is just a prototype; no sense building a full authentication flow.)
        const url = new URL(window.location.href);
        const activeAccessToken = accessToken || url.searchParams.get("accessToken");

        let activeRecordingId = recordingId;
        if (activeRecordingId === null) {
          activeRecordingId = url.searchParams.get("recordingId");
          if (!activeRecordingId) {
            throw Error(`Must specify "recordingId" parameter.`);
          }
        }

        await preloadIDBInitialValues(IDB_PREFS_DATABASES, recordingId!);

        const sessionId = await client.initialize(activeRecordingId, activeAccessToken);
        const endpoint = await client.getSessionEndpoint(sessionId);

        // The demo doesn't use these directly, but the client throws if they aren't loaded.
        const sources = await client.findSources();
        preCacheSources(sources);

        let currentUserInfo: UserInfo | null = null;
        if (activeAccessToken) {
          currentUserInfo = await getCurrentUserInfo(activeAccessToken);
        }

        setContext({
          accessToken: activeAccessToken,
          currentUserInfo,
          duration: endpoint.time,
          recordingId: activeRecordingId,
          sessionId,
          refetchUser: () => {},
          trackEvent: () => {},
          trackEventOnce: () => {},
        });
      };

      asyncInitialize();
    }

    didInitializeRef.current = true;
  }, [accessToken, client, recordingId]);

  useEffect(() => {
    const onChange = (loadedRegions: LoadedRegions) => {
      loadedRegions.indexed.forEach(({ begin, end }) => {
        preCacheExecutionPointForTime(begin);
        preCacheExecutionPointForTime(end);
      });
      loadedRegions.loaded.forEach(({ begin, end }) => {
        preCacheExecutionPointForTime(begin);
        preCacheExecutionPointForTime(end);
      });
      loadedRegions.loading.forEach(({ begin, end }) => {
        preCacheExecutionPointForTime(begin);
        preCacheExecutionPointForTime(end);
      });
    };

    client.addEventListener("loadedRegionsChange", onChange);
    return () => {
      client.removeEventListener("loadedRegionsChange", onChange);
    };
  }, [client]);

  if (context === null) {
    return <Loader className={styles.Loader} />;
  }

  return <SessionContext.Provider value={context}>{children}</SessionContext.Provider>;
}
