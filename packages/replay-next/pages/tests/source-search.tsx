import SearchFiles from "replay-next/components/search-files/SearchFiles";
import Sources from "replay-next/components/sources/Sources";
import { FocusContextRoot } from "replay-next/src/contexts/FocusContext";
import { KeyboardModifiersContextRoot } from "replay-next/src/contexts/KeyboardModifiersContext";
import { PointsContextRoot } from "replay-next/src/contexts/points/PointsContext";
import { SelectedFrameContextRoot } from "replay-next/src/contexts/SelectedFrameContext";
import { SourcesContextRoot } from "replay-next/src/contexts/SourcesContext";
import { TimelineContextRoot } from "replay-next/src/contexts/TimelineContext";
import { NodePickerContextRoot } from "ui/components/NodePickerContext";

import createTest from "./utils/createTest";
import styles from "./styles.module.css";

const DEFAULT_RECORDING_ID = "c9fffa00-ac71-48bc-adb2-52ae81588e85";

function SourceSearch() {
  return (
    <KeyboardModifiersContextRoot>
      <SourcesContextRoot>
        <PointsContextRoot>
          <TimelineContextRoot>
            <SelectedFrameContextRoot>
              <FocusContextRoot>
                <NodePickerContextRoot>
                  <div className={styles.Grid2Columns}>
                    <div className={styles.VerticalContainer}>
                      <SearchFiles limit={50} />
                    </div>
                    <div className={styles.VerticalContainer}>
                      <Sources />
                    </div>
                  </div>
                </NodePickerContextRoot>
              </FocusContextRoot>
            </SelectedFrameContextRoot>
          </TimelineContextRoot>
        </PointsContextRoot>
      </SourcesContextRoot>
    </KeyboardModifiersContextRoot>
  );
}

export default createTest(SourceSearch, DEFAULT_RECORDING_ID);
