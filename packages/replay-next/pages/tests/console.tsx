import createTest from "./utils/createTest";
import styles from "./styles.module.css";

import ConsoleRoot from "replay-next/components/console";
import { FocusContextRoot } from "replay-next/src/contexts/FocusContext";
import { KeyboardModifiersContextRoot } from "replay-next/src/contexts/KeyboardModifiersContext";
import { PointsContextRoot } from "replay-next/src/contexts/PointsContext";
import { SelectedFrameContextRoot } from "replay-next/src/contexts/SelectedFrameContext";
import { SourcesContextRoot } from "replay-next/src/contexts/SourcesContext";
import { TerminalContextRoot } from "replay-next/src/contexts/TerminalContext";
import { TimelineContextRoot } from "replay-next/src/contexts/TimelineContext";

const DEFAULT_RECORDING_ID = "0d0b52a9-96bc-4bd9-b5d8-66275c6cce96";

function Console() {
  return (
    <KeyboardModifiersContextRoot>
      <SourcesContextRoot>
        <PointsContextRoot>
          <TimelineContextRoot>
            <SelectedFrameContextRoot>
              <FocusContextRoot>
                <div className={styles.Grid1Column}>
                  <div className={styles.VerticalContainer}>
                    <TerminalContextRoot>
                      <ConsoleRoot showSearchInputByDefault={false} />
                    </TerminalContextRoot>
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

export default createTest(Console, DEFAULT_RECORDING_ID);
