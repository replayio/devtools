import Head from "next/head";
import React, { useEffect, useState } from "react";
import { connect, ConnectedProps, useStore } from "react-redux";
import { isTest } from "ui/utils/environment";
import { getAccessibleRecording } from "ui/actions/session";
import { Recording as RecordingInfo } from "ui/types";
import { getRecordingMetadata, useGetRecordingId } from "ui/hooks/recordings";
import LoadingScreen from "ui/components/shared/LoadingScreen";
import Upload from "./upload";
import DevTools from "ui/components/DevTools";
import setup from "ui/setup/dynamic/devtools";

function RecordingPage({
  getAccessibleRecording,
  head,
}: PropsFromRedux & { head?: React.ReactNode }) {
  const store = useStore();
  const recordingId = useGetRecordingId();
  const [recording, setRecording] = useState<RecordingInfo | null>();
  const [uploadComplete, setUploadComplete] = useState(false);
  useEffect(() => {
    if (!store || !recordingId) return;

    async function getRecording() {
      await setup(store);
      setRecording(await getAccessibleRecording(recordingId));
    }
    getRecording();
  }, [recordingId, store]);

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
}

const connector = connect(null, { getAccessibleRecording });
type PropsFromRedux = ConnectedProps<typeof connector>;

const ConnectedRecordingPage = connector(RecordingPage);

export async function getStaticProps({ params }: { params: { id: string } }) {
  return {
    props: {
      metadata: await getRecordingMetadata(params.id),
    },
    revalidate: 360,
  };
}

export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

interface MetadataProps {
  headOnly?: boolean;
  metadata?: {
    id: string;
    title?: string;
    url?: string;
    duration?: number;
    owner?: string;
  };
}

export default function SSRRecordingPage({ headOnly, metadata }: MetadataProps) {
  let head: React.ReactNode | null = null;

  if (metadata) {
    let title = metadata.title;
    let description = "Replay";
    try {
      const url = new URL(metadata.url || "");
      if (url.protocol !== "file:") {
        description += ` of ${url.hostname}`;
      }
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

    head = (
      <Head>
        {/* nosemgrep typescript.react.security.audit.reac-http-leak.react-http-leak */}
        <meta property="og:title" content={title} />
        {/* nosemgrep typescript.react.security.audit.reac-http-leak.react-http-leak */}
        <meta property="og:description" content={description} />
        {/* nosemgrep typescript.react.security.audit.reac-http-leak.react-http-leak */}
        <meta property="og:image" content={image} />
        <meta name="twitter:card" content={"summary_large_image"} />
        {/* nosemgrep typescript.react.security.audit.reac-http-leak.react-http-leak */}
        <meta property="twitter:image" content={image} />
        {/* nosemgrep typescript.react.security.audit.reac-http-leak.react-http-leak */}
        <meta property="twitter:title" content={title} />
        <meta name="twitter:site" content="@replayio" />
        {/* nosemgrep typescript.react.security.audit.reac-http-leak.react-http-leak */}
        <meta property="twitter:description" content={description} />
      </Head>
    );
  }

  if (headOnly) {
    return head;
  }

  return <ConnectedRecordingPage head={head} />;
}
