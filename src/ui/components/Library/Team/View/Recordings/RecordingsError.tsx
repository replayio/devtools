import { ReactNode, useContext } from "react";
import { isReplayBrowser } from "ui/utils/environment";
import styles from "../../../Library.module.css";
import { FilterContext } from "../FilterContext";

export function RecordingsError() {
  const { filter, setAppliedText } = useContext(FilterContext);
  let msg: string | ReactNode;

  if (filter) {
    msg = (
      <>
        <div>
          No results found.
          <span onClick={() => setAppliedText("")} className="pl-2 underline cursor-pointer">
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
      className={`flex flex-grow flex-col items-center justify-center space-y-1 text-lg h-3/4 ${styles.recordingsBackground}`}
    >
      <div className="p-6 m-24 text-bodyColor">{msg}</div>
    </section>
  );
}
