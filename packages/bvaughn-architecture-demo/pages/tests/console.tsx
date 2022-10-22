import ConsoleRoot from "@bvaughn/components/console";
import Input from "@bvaughn/components/console/Input";
import Loader from "@bvaughn/components/Loader";
import { FocusContextRoot } from "@bvaughn/src/contexts/FocusContext";
import { KeyboardModifiersContextRoot } from "@bvaughn/src/contexts/KeyboardModifiersContext";
import { PointsContextRoot } from "@bvaughn/src/contexts/PointsContext";
import { SourcesContextRoot } from "@bvaughn/src/contexts/SourcesContext";
import { TerminalContextRoot } from "@bvaughn/src/contexts/TerminalContext";
import { TimelineContextRoot } from "@bvaughn/src/contexts/TimelineContext";
import { Suspense } from "react";

import styles from "./styles.module.css";
import createTest from "./utils/createTest";

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
                    <ConsoleRoot
                      showSearchInputByDefault={false}
                      terminalInput={
                        <Suspense fallback={<Loader />}>
                          <Input />
                        </Suspense>
                      }
                    />
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
