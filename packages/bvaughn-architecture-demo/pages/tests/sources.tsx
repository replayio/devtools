import SourceExplorer from "bvaughn-architecture-demo/components/sources/SourceExplorer";
import Sources from "bvaughn-architecture-demo/components/sources/Sources";
import { FocusContextRoot } from "bvaughn-architecture-demo/src/contexts/FocusContext";
import { KeyboardModifiersContextRoot } from "bvaughn-architecture-demo/src/contexts/KeyboardModifiersContext";
import { PointsContextRoot } from "bvaughn-architecture-demo/src/contexts/PointsContext";
import { SourcesContextRoot } from "bvaughn-architecture-demo/src/contexts/SourcesContext";
import { TimelineContextRoot } from "bvaughn-architecture-demo/src/contexts/TimelineContext";

import styles from "./styles.module.css";
import createTest from "./utils/createTest";

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
