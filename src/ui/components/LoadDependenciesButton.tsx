import classnames from "classnames";
import { useContext } from "react";

import { useMostRecentLoadedPause } from "replay-next/src/hooks/useMostRecentLoadedPause";
import { pauseIdCache } from "replay-next/src/suspense/PauseCache";
import { TerminalContext } from "replay-next/src/contexts/TerminalContext";
import { replayClient } from "shared/client/ReplayClientContext";

let gNextPointId = 1;

export function LoadDependenciesButton() {
  const { point, time, pauseId } = useMostRecentLoadedPause() ?? {};
  const { addMessage } = useContext(TerminalContext);

  const title = "Load dependencies at this point";

  const onClick = async () => {
    if (!point || !time || !pauseId) {
      console.log(`Missing pause point`);
      return;
    }

    const steps = await replayClient.getDependencies(point);

    const pointId = gNextPointId++;

    for (const { code, point: stepPoint, time: stepTime } of steps) {
      if (stepPoint && stepTime) {
        const pauseId = await pauseIdCache.readAsync(
          replayClient,
          stepPoint,
          stepTime
        );
        addMessage({
          expression: `"P${pointId}: ${code}"`,
          frameId: null,
          pauseId,
          point: stepPoint,
          time: stepTime,
        });
      }
    }
  };

  return (
    <button
      className={classnames("devtools-button toolbar-panel-button tab")}
      id="command-button-load-dependencies"
      onClick={onClick}
      title={title}
    />
  );
}
