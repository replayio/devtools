import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import {
  initSocket,
  client,
  createSession,
  CommandRequest,
  CommandResponse,
} from "protocol/socket";
import { useStore } from "react-redux";
import { UIStore } from "ui/actions";
import { ExpectedError } from "ui/state/app";
import { onUnprocessedRegions } from "ui/actions/app";
import { getAccessibleRecording, showLoadingProgress } from "ui/actions/session";
import tokenManager from "ui/utils/tokenManager";
import LoadingScreen from "ui/components/shared/LoadingScreen";
import { ExpectedErrorScreen } from "ui/components/shared/Error";
import { setUnexpectedError } from "ui/actions/errors";
import type { UnexpectedError } from "ui/state/app";
import ProtocolViewer from "ui/components/ProtocolViewer";

import { replayRecording } from "playground";
import {
  eventReceived,
  requestSent,
  errorReceived,
  responseReceived,
  ProtocolEvent,
} from "ui/reducers/protocolMessages";
type SessionResult = { sessionId: string } | { error: string };

function getDisconnectionError(): UnexpectedError {
  return {
    action: "refresh",
    content: "Replays disconnect after 5 minutes to reduce server load.",
    message: "Ready when you are!",
  };
}

async function _createSession(recordingId: string, store: UIStore): Promise<SessionResult> {
  try {
    const recording = await store.dispatch(getAccessibleRecording(recordingId));
    if (!recording) {
      return { error: "The recording is not accessible" };
    }

    const dispatchUrl =
      new URL(location.href).searchParams.get("dispatch") || process.env.NEXT_PUBLIC_DISPATCH_URL!;
    initSocket(dispatchUrl);
    const token = await tokenManager.getToken();
    if (token.token) {
      await client.Authentication.setAccessToken({ accessToken: token.token });
    }
    const sessionId = await createSession(
      recordingId,
      undefined,
      {},
      {
        onEvent: (event: ProtocolEvent) => {
          store.dispatch(eventReceived({ ...event, recordedAt: window.performance.now() }));
        },
        onRequest: (request: CommandRequest) => {
          store.dispatch(requestSent({ ...request, recordedAt: window.performance.now() }));
        },
        onResponse: (response: CommandResponse) => {
          store.dispatch(responseReceived({ ...response, recordedAt: window.performance.now() }));
        },
        onResponseError: (error: CommandResponse) => {
          store.dispatch(errorReceived({ ...error, recordedAt: window.performance.now() }));
        },
        onSocketError: (evt: Event, initial: boolean, lastReceivedMessageTime: Number) => {
          console.error("Socket Error", evt);
          if (initial) {
            store.dispatch(
              setUnexpectedError({
                action: "refresh",
                content:
                  "A connection to our server could not be established. Please check your connection.",
                message: "Unable to establish socket connection",
                ...evt,
              })
            );
          } else if (Date.now() - +lastReceivedMessageTime < 300000) {
            store.dispatch(
              setUnexpectedError({
                action: "refresh",
                content: "The socket has closed due to an error. Please refresh the page.",
                message: "Unexpected socket error",
                ...evt,
              })
            );
          } else {
            store.dispatch(setUnexpectedError(getDisconnectionError(), true));
          }
        },
        onSocketClose: (willClose: boolean) => {
          if (!willClose) {
            store.dispatch(setUnexpectedError(getDisconnectionError(), true));
          }
        },
      },
      { allowMultipleListeners: true }
    );

    // this will show a progress bar in the LoadingScreen, note that the
    // sourcemap visualizer is shown as soon as the requested source and its sourcemap
    // have been loaded, which may happen before the progress bar reaches 100%
    client.Session.ensureProcessed({ level: "basic" }, sessionId);
    client.Session.addUnprocessedRegionsListener(regions =>
      store.dispatch(onUnprocessedRegions(regions))
    );
    store.dispatch(showLoadingProgress());

    // find the requested source

    return { sessionId };
  } catch (e) {
    return { error: "Could not create session" };
  }
}

export default function Playground() {
  const store = useStore();
  const router = useRouter();
  const [session, setSession] = useState<SessionResult | undefined>();

  const recordingId: string | undefined = router.query.recordingId;

  useEffect(() => {
    if (recordingId) {
      _createSession(recordingId, store).then(session => {
        console.log(session);
        setSession(session);
      });
    }
  }, [recordingId, store, recordingId]);

  useEffect(() => {
    if (session?.sessionId) {
      replayRecording(client, recordingId, session?.sessionId);
    }
  }, [session, recordingId]);

  if (!session) {
    return <LoadingScreen />;
  }

  if ("error" in session) {
    const error: ExpectedError = {
      message: "Error",
      content: session.error,
    };
    return <ExpectedErrorScreen error={error} />;
  }

  return (
    <div className=" h-full ">
      <div className="relative h-full w-80">
        <ProtocolViewer />
      </div>
    </div>
  );
}
