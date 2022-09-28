import Head from "next/head";
import { useRouter } from "next/router";
import { GetStaticProps } from "next/types";
import React, { useContext, useEffect, useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import { useAppDispatch, useAppStore } from "ui/setup/hooks";
import { isTest } from "ui/utils/environment";
import { setModal } from "ui/actions/app";
import { setExpectedError } from "ui/actions/errors";
import { getAccessibleRecording } from "ui/actions/session";
import DevTools from "ui/components/DevTools";
import LoadingScreen from "ui/components/shared/LoadingScreen";
import {
  getRecordingMetadata,
  useGetRecording,
  useGetRecordingId,
  useGetRawRecordingIdWithSlug,
  useSubscribeRecording,
} from "ui/hooks/recordings";
import setupDevtools from "ui/setup/dynamic/devtools";
import { Recording as RecordingInfo } from "ui/types";
import { extractIdAndSlug } from "ui/utils/helpers";
import { startUploadWaitTracking } from "ui/utils/mixpanel";
import { getRecordingURL } from "ui/utils/recording";
import useToken from "ui/utils/useToken";
import useConfigureReplayClientInterop from "ui/hooks/useReplayClient";

import Upload from "./upload";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { trackEvent } from "ui/utils/telemetry";

interface MetadataProps {
  metadata?: {
    id: string;
    title?: string;
    url?: string;
    duration?: number;
    owner?: string;
  };
}

function RecordingHead({ metadata }: MetadataProps) {
  if (!metadata) {
    return null;
  }

  let title = metadata.title;
  let description = "Replay";
  try {
    const url = new URL(metadata.url || "");
    if (url.protocol !== "file:") {
      description += ` of ${url.hostname}`;
    }
  } catch {
    // ignore invalid URLs
  } finally {
    if (metadata.owner) {
      description += ` by ${metadata.owner}`;
    }
  }

  if (!title && description) {
    title = description;
    description = "";
  }

  const image = `${process.env.NEXT_PUBLIC_IMAGE_URL}${metadata.id}.png`;

  return (
    <Head>
      <title>{title}</title>
      {/* nosemgrep typescript.react.security.audit.react-http-leak.react-http-leak */}
      <meta property="og:title" content={title} />
      {/* nosemgrep typescript.react.security.audit.react-http-leak.react-http-leak */}
      <meta property="og:description" content={description} />
      {/* nosemgrep typescript.react.security.audit.react-http-leak.react-http-leak */}
      <meta property="og:image" content={image} />
      <meta name="twitter:card" content="summary_large_image" />
      {/* nosemgrep typescript.react.security.audit.react-http-leak.react-http-leak */}
      <meta property="twitter:image" content={image} />
      {/* nosemgrep typescript.react.security.audit.react-http-leak.react-http-leak */}
      <meta property="twitter:title" content={title} />
      <meta name="twitter:site" content="@replayio" />
      {/* nosemgrep typescript.react.security.audit.react-http-leak.react-http-leak */}
      <meta property="twitter:description" content={description} />
    </Head>
  );
}

function useRecordingSlug(recordingId: string) {
  const router = useRouter();
  const { recording } = useGetRecording(recordingId);

  useEffect(() => {
    if (recording?.title) {
      const url = getRecordingURL(recording);
      const currentURL = new URL(window.location.origin + router.asPath).pathname;
      if (url !== currentURL) {
        // clone the query object to remove the id parameter
        const query = {
          ...router.query,
        };
        delete query.id;

        router.replace(
          {
            pathname: url,
            query,
          },
          undefined,
          { shallow: true }
        );
      }
    }
  }, [router, recording, recording?.title]);

  return { recording };
}

function RecordingPage({
  getAccessibleRecording,
  setExpectedError,
  head,
}: PropsFromRedux & { head?: React.ReactNode }) {
  const token = useToken();
  const store = useAppStore();
  const { query } = useRouter();
  const dispatch = useAppDispatch();
  const recordingId = useGetRecordingId();
  const rawRecordingId = useGetRawRecordingIdWithSlug();
  useRecordingSlug(recordingId);
  useSubscribeRecording(recordingId);
  const [recording, setRecording] = useState<RecordingInfo | null>();
  const [uploadComplete, setUploadComplete] = useState(false);

  useConfigureReplayClientInterop();
  const replayClient = useContext(ReplayClientContext);

  useEffect(() => {
    if (!store) {
      return;
    }
    if (!recordingId) {
      setExpectedError({
        content: `"${rawRecordingId}" is not a valid recording ID`,
        message: "Invalid ID",
      });
      return;
    }

    async function getRecording() {
      await setupDevtools(store, replayClient);
      const rec = await getAccessibleRecording(recordingId);
      setRecording(rec);

      if (rec?.metadata?.test) {
        trackEvent("session_start.test");
      }

      if (Array.isArray(query.id) && query.id[query.id.length - 1] === "share") {
        dispatch(setModal("sharing", { recordingId }));
      }
    }

    getRecording();
  }, [
    dispatch,
    getAccessibleRecording,
    query.id,
    rawRecordingId,
    recordingId,
    setExpectedError,
    store,
    token.token,
    replayClient,
  ]);
  const onUpload = () => {
    startUploadWaitTracking();
    setUploadComplete(true);
  };

  if (!recording || typeof window === "undefined") {
    return (
      <>
        {head}
        <LoadingScreen fallbackMessage="Finding recording..." />
      </>
    );
  }

  // Add a check to make sure the recording has an associated user ID.
  // We skip the upload step if there's no associated user ID, which
  // is the case for CI test recordings.
  if (!uploadComplete && recording.isInitialized === false && !isTest() && recording.userId) {
    return <Upload onUpload={onUpload} />;
  } else {
    return (
      <>
        {head}
        <DevTools uploadComplete={uploadComplete} />
      </>
    );
  }
}

const connector = connect(null, { getAccessibleRecording, setExpectedError });
type PropsFromRedux = ConnectedProps<typeof connector>;

const ConnectedRecordingPage = connector(RecordingPage);

export const getStaticProps: GetStaticProps = async function ({ params }) {
  const { id } = extractIdAndSlug(params?.id);
  return {
    props: {
      metadata: id ? await getRecordingMetadata(id) : null,
    },
  };
};

export async function getStaticPaths() {
  return { fallback: "blocking", paths: [] };
}

type SSRProps = MetadataProps & { headOnly?: boolean };

export default function SSRRecordingPage({ headOnly, metadata }: SSRProps) {
  let head: React.ReactNode = <RecordingHead metadata={metadata} />;

  if (headOnly) {
    return head;
  }

  return <ConnectedRecordingPage head={head} />;
}
