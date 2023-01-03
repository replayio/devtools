import ConsoleRoot from "replay-next/components/console";
import SourceExplorer from "replay-next/components/sources/SourceExplorer";
import Sources from "replay-next/components/sources/Sources";
import { FocusContextRoot } from "replay-next/src/contexts/FocusContext";
import { KeyboardModifiersContextRoot } from "replay-next/src/contexts/KeyboardModifiersContext";
import { PointsContextRoot } from "replay-next/src/contexts/PointsContext";
import { SelectedFrameContextRoot } from "replay-next/src/contexts/SelectedFrameContext";
import { SourcesContextRoot } from "replay-next/src/contexts/SourcesContext";
import { TerminalContextRoot } from "replay-next/src/contexts/TerminalContext";
import { TimelineContextRoot } from "replay-next/src/contexts/TimelineContext";

import createTest from "./utils/createTest";
import styles from "./styles.module.css";

const DEFAULT_RECORDING_ID = "dbd4da74-cf42-41fb-851d-69bed67debcf";

function SourceAndConsole() {
  return (
    <KeyboardModifiersContextRoot>
      <SourcesContextRoot>
        <PointsContextRoot>
          <TimelineContextRoot>
            <SelectedFrameContextRoot>
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
            </SelectedFrameContextRoot>
          </TimelineContextRoot>
        </PointsContextRoot>
      </SourcesContextRoot>
    </KeyboardModifiersContextRoot>
  );
}

export default createTest(SourceAndConsole, DEFAULT_RECORDING_ID);
