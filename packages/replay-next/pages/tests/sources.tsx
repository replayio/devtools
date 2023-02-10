import SourceExplorer from "replay-next/components/sources/SourceExplorer";
import Sources from "replay-next/components/sources/Sources";
import { FocusContextRoot } from "replay-next/src/contexts/FocusContext";
import { KeyboardModifiersContextRoot } from "replay-next/src/contexts/KeyboardModifiersContext";
import { PointsContextRoot } from "replay-next/src/contexts/points/PointsContext";
import { SourcesContextRoot } from "replay-next/src/contexts/SourcesContext";
import { TimelineContextRoot } from "replay-next/src/contexts/TimelineContext";

import createTest from "./utils/createTest";
import styles from "./styles.module.css";

const DEFAULT_RECORDING_ID = "aeaf1d96-c47a-4584-87cf-4f9bd9f65d85";

function Source() {
  return (
    <KeyboardModifiersContextRoot>
      <SourcesContextRoot>
        <PointsContextRoot>
          <TimelineContextRoot>
            <FocusContextRoot>
              <div className={styles.Grid2Columns}>
                <div className={styles.VerticalContainer}>
                  <SourceExplorer />
                </div>
                <div className={styles.VerticalContainer}>
                  <Sources />
                </div>
              </div>
            </FocusContextRoot>
          </TimelineContextRoot>
        </PointsContextRoot>
      </SourcesContextRoot>
    </KeyboardModifiersContextRoot>
  );
}

export default createTest(Source, DEFAULT_RECORDING_ID);
