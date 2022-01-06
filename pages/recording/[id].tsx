import React, { useEffect, useState } from "react";
import { connect, ConnectedProps, useStore } from "react-redux";
import { isTest } from "ui/utils/environment";
import { getAccessibleRecording } from "ui/actions/session";
import { Recording, Recording as RecordingInfo } from "ui/types";
import { useGetRecordingId } from "ui/hooks/recordings";
import LoadingScreen from "ui/components/shared/LoadingScreen";
import Upload from "./upload";
import DevTools from "ui/components/DevTools";
import setup from "ui/setup/dynamic/devtools";
import Head from "next/head";

interface MetadataProps {
  metadata: {
    title?: string;
    url?: string;
    duration?: number;
    image?: string;
  };
}

function RecordingPage({ getAccessibleRecording, metadata }: PropsFromRedux & MetadataProps) {
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

  const head = metadata ? (
    <Head>
      <meta property="og:title" content={metadata.title} />
      <meta
        property="og:description"
        content={`${Math.round((metadata.duration || 0) / 1000)} second replay`}
      />
      <meta property="og:image" content={metadata.image} />
      <meta name="twitter:card" content={metadata.image ? "summary_large_image" : "summary"} />
      <meta property="twitter:image" content={metadata.image} />
      <meta property="twitter:title" content={metadata.title} />
      <meta name="twitter:site" content="@replayio" />
      <meta
        property="twitter:description"
        content={`${Math.round((metadata.duration || 0) / 1000)} second replay`}
      />
    </Head>
  ) : null;

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

export async function getStaticProps({ params }: { params: { id: string } }) {
  const resp = await fetch(process.env.NEXT_PUBLIC_API_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
        query GetRecording($recordingId: UUID!) {
          recording(uuid: $recordingId) {
            uuid
            url
            title
            duration
            private
            isInitialized
            thumbnail
            comments {
              id
            }
            workspace {
              name
            }
          }
        }
      `,
      variables: {
        recordingId: params.id,
      },
    }),
  });

  const json: { data: { recording: Recording & { thumbnail?: string } }; error: any } =
    await resp.json();

  if (json.error || !json.data.recording) {
    return {
      props: {},
    };
  }

  return {
    props: {
      metadata: {
        title: json.data.recording.title,
        url: json.data.recording.url,
        duration: json.data.recording.duration,
        image: json.data.recording.thumbnail,
      },
    },
  };
}

export async function getStaticPaths() {
  return { paths: [], fallback: true };
}

const connector = connect(null, { getAccessibleRecording });
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(RecordingPage);
