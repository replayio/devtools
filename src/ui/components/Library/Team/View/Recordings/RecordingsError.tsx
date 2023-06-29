import { ReactNode, useContext } from "react";

import { isReplayBrowser } from "shared/utils/environment";

import { FilterContext } from "../FilterContext";
import styles from "../../../Library.module.css";

export function RecordingsError() {
  const { filter, setAppliedText } = useContext(FilterContext);
  let msg: string | ReactNode;

  if (filter) {
    msg = (
      <>
        <div>
          No results found.
          <span onClick={() => setAppliedText("")} className="cursor-pointer pl-2 underline">
            Show all replays?
          </span>
        </div>
      </>
    );
  } else if (isReplayBrowser()) {
    msg = "Please open a new tab and press the blue record button to record a Replay";
  } else {
    msg = "👋 This is where your replays will go!";
  }

  return (
    <section
      className={`flex h-3/4 flex-grow flex-col items-center justify-center space-y-1 text-lg ${styles.recordingsBackground}`}
    >
      <div className="m-24 p-6 text-bodyColor">{msg}</div>
    </section>
  );
}
