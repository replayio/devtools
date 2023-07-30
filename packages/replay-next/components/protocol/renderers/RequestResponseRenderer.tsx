import { useMemo } from "react";

import JsonViewer from "replay-next/components/SyntaxHighlighter";
import { formatDuration } from "replay-next/src/utils/time";

import { RequestResponse } from "../ProtocolMessagesStore";
import styles from "./shared.module.css";

export function RequestResponseHeaderRenderer({ message }: { message: RequestResponse }) {
  let status = null;
  if (message.error !== null) {
    status = "Failed";
  } else if (message.duration !== null) {
    status = formatDuration(message.duration);
  }

  return (
    <>
      <span className={styles.HeaderPrimary}>{message.request.method}</span>
      {status && <small className={styles.HeaderSecondary}>({status})</small>}
    </>
  );
}

export function RequestResponseRenderer({ message }: { message: RequestResponse }) {
  const { error, request, response } = message;

  const errorCode = useMemo(() => (error ? JSON.stringify(error, null, 2) : null), [error]);
  const requestCode = useMemo(() => JSON.stringify(request, null, 2), [request]);
  const responseCode = useMemo(
    () => (response ? JSON.stringify(response.result, null, 2) : null),
    [response]
  );

  return (
    <>
      <Section jsonText={requestCode} header="Request" />
      <Section jsonText={responseCode} header="Response" />
      <Section jsonText={errorCode} header="Error" />
    </>
  );
}

function Section({ header, jsonText }: { header: string; jsonText: string | null }) {
  if (jsonText === null || jsonText === "{}") {
    return null;
  }

  return (
    <>
      <div className={styles.SubHeader}>{header}</div>
      <JsonViewer jsonText={jsonText} />
    </>
  );
}
