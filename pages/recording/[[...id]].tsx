import Head from "next/head";
import { useRouter } from "next/router";
import { GetServerSideProps, GetStaticProps } from "next/types";
import React, { useContext, useEffect, useState } from "react";
import { ConnectedProps, connect } from "react-redux";

import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { Recording as RecordingInfo } from "shared/graphql/types";
import { setModal } from "ui/actions/app";
import { setExpectedError } from "ui/actions/errors";
import { getAccessibleRecording } from "ui/actions/session";
import DevTools from "ui/components/DevTools";
import LoadingScreen from "ui/components/shared/LoadingScreen";
import {
  getRecordingMetadata,
  useGetRawRecordingIdWithSlug,
  useGetRecording,
  useGetRecordingId,
  useSubscribeRecording,
} from "ui/hooks/recordings";
import setupDevtools, { migratePerRecordingPersistedSettings } from "ui/setup/dynamic/devtools";
import { useAppDispatch, useAppStore } from "ui/setup/hooks";
import { isTest } from "ui/utils/environment";
import { extractIdAndSlug } from "ui/utils/helpers";
import { startUploadWaitTracking } from "ui/utils/mixpanel";
import { getRecordingURL } from "ui/utils/recording";
import { trackEvent } from "ui/utils/telemetry";
import useToken from "ui/utils/useToken";

import Upload from "./upload";

migratePerRecordingPersistedSettings();

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
      <meta property="og:type" content="website" />
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
  apiKey,
  getAccessibleRecording,
  setExpectedError,
  head,
}: PropsFromRedux & { apiKey?: string; head?: React.ReactNode }) {
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
      if (!rec) {
        return;
      }

      setRecording(rec);

      const isTestReplay = rec.metadata?.test && rec.metadata?.source;
      const isTestWorkspace = rec.workspace?.isTest;

      if (rec.private) {
        if (isTestReplay && !isTestWorkspace) {
          setExpectedError({
            content: "This recording is not available.",
            message: "The recording must belong to a test suite",
          });
        } else if (!isTestReplay && isTestWorkspace) {
          setExpectedError({
            content: "This recording is not available.",
            message: "The recording cannot be in a test suite",
          });
        }
      }

      if (rec.metadata?.test) {
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
        <DevTools apiKey={apiKey} uploadComplete={uploadComplete} />
      </>
    );
  }
}

const connector = connect(null, { getAccessibleRecording, setExpectedError });
type PropsFromRedux = ConnectedProps<typeof connector>;

const ConnectedRecordingPage = connector(RecordingPage);

export const getServerSideProps: GetServerSideProps = async function ({ params }) {
  const { id } = extractIdAndSlug(params?.id);
  return {
    props: {
      metadata: id ? await getRecordingMetadata(id) : null,
    },
  };
};

type SSRProps = MetadataProps & { apiKey?: string; headOnly?: boolean };

export default function SSRRecordingPage({ apiKey, headOnly, metadata }: SSRProps) {
  let head: React.ReactNode = <RecordingHead metadata={metadata} />;

  if (headOnly) {
    return head;
  }

  return <ConnectedRecordingPage apiKey={apiKey} head={head} />;
}
