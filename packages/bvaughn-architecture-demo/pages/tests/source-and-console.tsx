import ConsoleRoot from "bvaughn-architecture-demo/components/console";
import SourceExplorer from "bvaughn-architecture-demo/components/sources/SourceExplorer";
import Sources from "bvaughn-architecture-demo/components/sources/Sources";
import { FocusContextRoot } from "bvaughn-architecture-demo/src/contexts/FocusContext";
import { KeyboardModifiersContextRoot } from "bvaughn-architecture-demo/src/contexts/KeyboardModifiersContext";
import { PointsContextRoot } from "bvaughn-architecture-demo/src/contexts/PointsContext";
import { SourcesContextRoot } from "bvaughn-architecture-demo/src/contexts/SourcesContext";
import { TerminalContextRoot } from "bvaughn-architecture-demo/src/contexts/TerminalContext";
import { TimelineContextRoot } from "bvaughn-architecture-demo/src/contexts/TimelineContext";

import styles from "./styles.module.css";
import createTest from "./utils/createTest";

const DEFAULT_RECORDING_ID = "dbd4da74-cf42-41fb-851d-69bed67debcf";

function SourceAndConsole() {
  return (
    <KeyboardModifiersContextRoot>
      <SourcesContextRoot>
        <PointsContextRoot>
          <TimelineContextRoot>
            <FocusContextRoot>
              <div className={styles.Grid3Columns}>
                <div className={styles.VerticalContainer}>
                  <SourceExplorer />
                </div>
                <div className={styles.VerticalContainer}>
                  <Sources />
                </div>
                <div className={styles.VerticalContainer}>
                  <TerminalContextRoot>
                    <ConsoleRoot />
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

export default createTest(SourceAndConsole, DEFAULT_RECORDING_ID);
