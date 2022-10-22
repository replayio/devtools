import ConsoleRoot from "@bvaughn/components/console";
import SourceExplorer from "@bvaughn/components/sources/SourceExplorer";
import Sources from "@bvaughn/components/sources/Sources";
import { FocusContextRoot } from "@bvaughn/src/contexts/FocusContext";
import { KeyboardModifiersContextRoot } from "@bvaughn/src/contexts/KeyboardModifiersContext";
import { PointsContextRoot } from "@bvaughn/src/contexts/PointsContext";
import { SourcesContextRoot } from "@bvaughn/src/contexts/SourcesContext";
import { TerminalContextRoot } from "@bvaughn/src/contexts/TerminalContext";
import { TimelineContextRoot } from "@bvaughn/src/contexts/TimelineContext";

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
