import { memo } from "react";

import { truncateMiddle } from "replay-next/src/utils/string";
import { NetworkRequestEvent } from "shared/test-suites/RecordingTestMetadata";
import { setSelectedPanel } from "ui/actions/layout";
import { selectAndFetchRequest } from "ui/actions/network";
import { useAppDispatch } from "ui/setup/hooks";

import styles from "./NetworkRequestEventRow.module.css";

export default memo(function NetworkRequestEventRow({
  networkRequestEvent,
}: {
  networkRequestEvent: NetworkRequestEvent;
}) {
  const { request, response } = networkRequestEvent.data;
  const { id, method, url } = request;

  const dispatch = useAppDispatch();

  let statusBadge: string = "unresolved";
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
    dispatch(selectAndFetchRequest(id));
  };

  const formattedPathname = truncateMiddle(pathname, 150);

  return (
    <div className={styles.Indented} onClick={showNetworkPanel}>
      <div className={styles.Text}>
        <span className={styles.StatusBadge} data-status-badge={statusBadge} />{" "}
        <span className={styles.Token}>{method}</span>{" "}
        {response && (
          <>
            <span className={styles.Token}>{response.status}</span>{" "}
          </>
        )}
        <span className={styles.Token}>{formattedPathname}</span>
      </div>
    </div>
  );
});
