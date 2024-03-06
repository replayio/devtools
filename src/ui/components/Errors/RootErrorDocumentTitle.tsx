import Head from "next/head";

import { useGetRecordingTitle } from "shared/graphql/Recording";
import { getRecordingId } from "shared/utils/recording";

export function RootErrorDocumentTitle() {
  const { title = "Replay" } = useGetRecordingTitle(getRecordingId());

  return (
    <Head>
      <title>{title}</title>
    </Head>
  );
}
