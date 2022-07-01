import { ReactNode, useContext } from "react";
import { PrimaryButton } from "ui/components/shared/Button";
import { isReplayBrowser } from "ui/utils/environment";
import styles from "../../../Library.module.css";
import { FilterContext } from "../FilterContext";

export function RecordingsError() {
  const { filter, setAppliedText } = useContext(FilterContext);
  let msg: string | ReactNode;

  if (filter) {
    msg = (
      <>
        <div>No recordings found</div>
        <PrimaryButton color="blue" onClick={() => setAppliedText("")}>
          Clear filters
        </PrimaryButton>
      </>
    );
  } else if (isReplayBrowser()) {
    msg = "Please open a new tab and press the blue record button to record a Replay";
  } else {
    msg = "👋 This is where your replays will go!";
  }

  return (
    <section
      className={`flex flex-grow flex-col items-center justify-center space-y-1 text-lg ${styles.recordingsBackground}`}
    >
      {msg}
    </section>
  );
}
