import SourceExplorer from "@bvaughn/components/sources/SourceExplorer";
import Sources from "@bvaughn/components/sources/Sources";
import { FocusContextRoot } from "@bvaughn/src/contexts/FocusContext";
import { TimelineContextRoot } from "@bvaughn/src/contexts/TimelineContext";
import { PointsContextRoot } from "@bvaughn/src/contexts/PointsContext";
import { SourcesContextRoot } from "@bvaughn/src/contexts/SourcesContext";

import styles from "./styles.module.css";
import createTest from "./utils/createTest";

const DEFAULT_RECORDING_ID = "aeaf1d96-c47a-4584-87cf-4f9bd9f65d85";

function Source() {
  return (
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
  );
}

export default createTest(Source, DEFAULT_RECORDING_ID);
