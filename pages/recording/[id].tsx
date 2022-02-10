import Head from "next/head";
import { useRouter } from "next/router";
import React, { FC, useEffect, useState } from "react";
import { connect, ConnectedProps, useStore } from "react-redux";
import { isTest } from "ui/utils/environment";
import { getAccessibleRecording, setExpectedError } from "ui/actions/session";
import { Recording as RecordingInfo } from "ui/types";
import {
  getRecordingMetadata,
  useGetRecording,
  useGetRecordingId,
  useGetRawRecordingIdWithSlug,
} from "ui/hooks/recordings";
import { getRecordingURL } from "ui/utils/recording";
import LoadingScreen from "ui/components/shared/LoadingScreen";
import Upload from "./upload";
import DevTools from "ui/components/DevTools";
import setup from "ui/setup/dynamic/devtools";
import { GetStaticPaths, GetStaticProps } from "next/types";
import { extractIdAndSlug } from "ui/utils/helpers";

interface MetadataProps {
  metadata?: {
    id: string;
    title?: string;
    url?: string;
    duration?: number;
    owner?: string;
  };
}

const RecordingHead: FC<MetadataProps> = ({ metadata }) => {
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
};

const useRecordingSlug = (recordingId: string): { recording: RecordingInfo | undefined } => {
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
};

const RecordingPage: FC<PropsFromRedux & { head?: React.ReactNode }> = ({
  getAccessibleRecording,
  setExpectedError,
  head,
}) => {
  const store = useStore();
  const recordingId = useGetRecordingId();
  const rawRecordingId = useGetRawRecordingIdWithSlug();
  useRecordingSlug(recordingId);
  const [recording, setRecording] = useState<RecordingInfo | null>();
  const [uploadComplete, setUploadComplete] = useState(false);
  useEffect(() => {
    if (!store) return;
    if (!recordingId) {
      setExpectedError({
        message: "Invalid ID",
        content: `"${rawRecordingId}" is not a valid recording ID`,
      });
      return;
    }

    async function getRecording(): Promise<void> {
      await setup(store);
      setRecording(await getAccessibleRecording(recordingId));
    }
    getRecording();
  }, [recordingId, rawRecordingId, store, getAccessibleRecording, setExpectedError]);

  if (!recording || typeof window === "undefined") {
    return (
      <>
        {head}
        <LoadingScreen />
      </>
    );
  }

  // Add a check to make sure the recording has an associated user ID.
  // We skip the upload step if there's no associated user ID, which
  // is the case for CI test recordings.
  if (!uploadComplete && recording.isInitialized === false && !isTest() && recording.userId) {
    return <Upload onUpload={() => setUploadComplete(true)} />;
  } else {
    return (
      <>
        {head}
        <DevTools uploadComplete={uploadComplete} />
      </>
    );
  }
};

const connector = connect(null, { getAccessibleRecording, setExpectedError });
type PropsFromRedux = ConnectedProps<typeof connector>;

const ConnectedRecordingPage = connector(RecordingPage);

export const getStaticProps: GetStaticProps = async function ({ params }) {
  const { id } = extractIdAndSlug(params?.id);
  return {
    props: {
      metadata: id ? await getRecordingMetadata(id) : null,
    },
    revalidate: 360,
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  return { paths: [], fallback: "blocking" };
};

type SSRProps = MetadataProps & { headOnly?: boolean };

const SSRRecordingPage: FC<SSRProps> = ({ headOnly, metadata }) => {
  const head = <RecordingHead metadata={metadata} />;

  if (headOnly) {
    return head;
  }

  return <ConnectedRecordingPage head={head} />;
};

export default SSRRecordingPage;
