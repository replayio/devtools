import { memo } from "react";

import { NetworkRequestEvent } from "shared/test-suites/RecordingTestMetadata";
import { setSelectedPanel } from "ui/actions/layout";
import { useAppDispatch } from "ui/setup/hooks";

import styles from "./NetworkRequestEventRow.module.css";

export default memo(function NetworkRequestEventRow({
  networkRequestEvent,
}: {
  networkRequestEvent: NetworkRequestEvent;
}) {
  const { request, response } = networkRequestEvent.data;
  const { method, url } = request;

  const dispatch = useAppDispatch();

  let statusBadge: string | null = null;
  if (response != null) {
    if (response.status >= 400) {
      statusBadge = "error";
    } else {
      statusBadge = "success";
    }
  }

  const pathname = new URL(url).pathname;

  const showNetworkPanel = () => {
    dispatch(setSelectedPanel("network"));
  };

  return (
    <div className={styles.Indented} onClick={showNetworkPanel}>
      <div className={styles.Text}>
        {statusBadge !== null && (
          <>
            <span className={styles.StatusBadge} data-status-badge={statusBadge} />{" "}
          </>
        )}
        <span className={styles.Token}>{method}</span>{" "}
        {response && (
          <>
            <span className={styles.Token}>{response.status}</span>{" "}
          </>
        )}
        <span className={styles.Token}>{pathname}</span>
      </div>
    </div>
  );
});
