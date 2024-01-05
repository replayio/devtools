import ConsoleRoot from "replay-next/components/console";
import { FocusContextRoot } from "replay-next/src/contexts/FocusContext";
import { KeyboardModifiersContextRoot } from "replay-next/src/contexts/KeyboardModifiersContext";
import { PointsContextRoot } from "replay-next/src/contexts/points/PointsContext";
import { SelectedFrameContextRoot } from "replay-next/src/contexts/SelectedFrameContext";
import { SourcesContextRoot } from "replay-next/src/contexts/SourcesContext";
import { TerminalContextRoot } from "replay-next/src/contexts/TerminalContext";
import { TimelineContextRoot } from "replay-next/src/contexts/TimelineContext";
import { NodePickerContextRoot } from "ui/components/NodePickerContext";

import createTest from "./utils/createTest";
import styles from "./styles.module.css";

const DEFAULT_RECORDING_ID = "4ccc9f9f-f0d3-4418-ac21-1b316e462a44";

function Console() {
  return (
    <KeyboardModifiersContextRoot>
      <SourcesContextRoot>
        <PointsContextRoot>
          <TimelineContextRoot>
            <SelectedFrameContextRoot>
              <FocusContextRoot>
                <NodePickerContextRoot>
                  <div className={styles.Grid1Column}>
                    <div className={styles.VerticalContainer}>
                      <TerminalContextRoot>
                        <ConsoleRoot showSearchInputByDefault={false} />
                      </TerminalContextRoot>
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

export default createTest(Console, DEFAULT_RECORDING_ID);
