import SearchFiles from "bvaughn-architecture-demo/components/search-files/SearchFiles";
import Sources from "bvaughn-architecture-demo/components/sources/Sources";
import { FocusContextRoot } from "bvaughn-architecture-demo/src/contexts/FocusContext";
import { KeyboardModifiersContextRoot } from "bvaughn-architecture-demo/src/contexts/KeyboardModifiersContext";
import { PointsContextRoot } from "bvaughn-architecture-demo/src/contexts/PointsContext";
import { SelectedFrameContextRoot } from "bvaughn-architecture-demo/src/contexts/SelectedFrameContext";
import { SourcesContextRoot } from "bvaughn-architecture-demo/src/contexts/SourcesContext";
import { TimelineContextRoot } from "bvaughn-architecture-demo/src/contexts/TimelineContext";

import createTest from "./utils/createTest";
import styles from "./styles.module.css";

const DEFAULT_RECORDING_ID = "dbd4da74-cf42-41fb-851d-69bed67debcf";

function SourceSearch() {
  return (
    <KeyboardModifiersContextRoot>
      <SourcesContextRoot>
        <PointsContextRoot>
          <TimelineContextRoot>
            <SelectedFrameContextRoot>
              <FocusContextRoot>
                <div className={styles.Grid2Columns}>
                  <div className={styles.VerticalContainer}>
                    <SearchFiles limit={50} />
                  </div>
                  <div className={styles.VerticalContainer}>
                    <Sources />
                  </div>
                </div>
              </FocusContextRoot>
            </SelectedFrameContextRoot>
          </TimelineContextRoot>
        </PointsContextRoot>
      </SourcesContextRoot>
    </KeyboardModifiersContextRoot>
  );
}

export default createTest(SourceSearch, DEFAULT_RECORDING_ID);
