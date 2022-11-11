import ConsoleRoot from "bvaughn-architecture-demo/components/console";
import { FocusContextRoot } from "bvaughn-architecture-demo/src/contexts/FocusContext";
import { KeyboardModifiersContextRoot } from "bvaughn-architecture-demo/src/contexts/KeyboardModifiersContext";
import { PointsContextRoot } from "bvaughn-architecture-demo/src/contexts/PointsContext";
import { SourcesContextRoot } from "bvaughn-architecture-demo/src/contexts/SourcesContext";
import { TerminalContextRoot } from "bvaughn-architecture-demo/src/contexts/TerminalContext";
import { TimelineContextRoot } from "bvaughn-architecture-demo/src/contexts/TimelineContext";

import createTest from "./utils/createTest";
import styles from "./styles.module.css";

const DEFAULT_RECORDING_ID = "0d0b52a9-96bc-4bd9-b5d8-66275c6cce96";

function Console() {
  return (
    <KeyboardModifiersContextRoot>
      <SourcesContextRoot>
        <PointsContextRoot>
          <TimelineContextRoot>
            <FocusContextRoot>
              <div className={styles.Grid1Column}>
                <div className={styles.VerticalContainer}>
                  <TerminalContextRoot>
                    <ConsoleRoot showSearchInputByDefault={false} />
                  </TerminalContextRoot>
                </div>
              </div>
            </FocusContextRoot>
          </TimelineContextRoot>
        </PointsContextRoot>
      </SourcesContextRoot>
    </KeyboardModifiersContextRoot>
  );
}

export default createTest(Console, DEFAULT_RECORDING_ID);
