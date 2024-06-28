import { ExecutionPoint, TimeStampedPoint } from "@replayio/protocol";
import React, { useContext, useState } from "react";
import { useImperativeCacheValue } from "suspense";

import { Button } from "replay-next/components/Button";
import Icon from "replay-next/components/Icon";
import Loader from "replay-next/components/Loader";
import { JsonViewer } from "replay-next/components/SyntaxHighlighter/JsonViewer";
import { useMostRecentLoadedPause } from "replay-next/src/hooks/useMostRecentLoadedPause";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { seek } from "ui/actions/timeline";
import { useAppDispatch } from "ui/setup/hooks";
import { depGraphCache, reactComponentStackCache } from "ui/suspense/depGraphCache";

import inspectorStyles from "replay-next/components/inspector/values/shared.module.css";

function JumpToDefinitionButton({ point }: { point?: TimeStampedPoint }) {
  const dispatch = useAppDispatch();
  let onClick = point
    ? () => {
        dispatch(seek({ executionPoint: point.point, openSource: true, time: point.time }));
      }
    : undefined;
  return (
    <button
      className={inspectorStyles.IconButton}
      data-test-name="JumpToDefinitionButton"
      onClick={onClick}
      title="Jump to point"
    >
      <Icon className={inspectorStyles.Icon} type="view-function-source" />
    </button>
  );
}

export function ReactComponentStack() {
  const { point, time, pauseId } = useMostRecentLoadedPause() ?? {};
  const replayClient = useContext(ReplayClientContext);
  const [currentPoint, setCurrentPoint] = useState<ExecutionPoint | null>(null);

  const { status: depGraphStatus, value: depGraphValue } = useImperativeCacheValue(
    depGraphCache,
    replayClient,
    currentPoint
  );

  const { status: reactStackStatus, value: reactStackValue } = useImperativeCacheValue(
    reactComponentStackCache,
    replayClient,
    currentPoint
  );

  if (!pauseId || !point) {
    return <div>Not paused at a point</div>;
  }

  let depGraphContent: React.ReactNode = undefined;
  let formattedDepGraphContent: React.ReactNode = undefined;
  let reactStackContent: React.ReactNode = undefined;

  if (depGraphStatus === "rejected") {
    depGraphContent = <div>Error loading dependencies</div>;
  } else if (depGraphStatus === "pending") {
    depGraphContent = <Loader />;
  } else {
    depGraphContent = (
      <div className="m-1 grow border ">
        <h3 className="text-sm font-bold">Dependency Graph JSON</h3>
        <JsonViewer jsonText={JSON.stringify(depGraphValue, null, 2)} />
      </div>
    );

    formattedDepGraphContent = (
      <div className="m-1 grow border ">
        <h3 className="text-sm font-bold">Dependency Graph Formatted</h3>
        <div className="m-1 flex flex-col">
          {depGraphValue?.map((entry, index) => {
            let jumpButton: React.ReactNode = undefined;

            if (entry.point && entry.time) {
              jumpButton = (
                <JumpToDefinitionButton point={{ point: entry.point, time: entry.time }} />
              );
            }

            return (
              <div key={index} className="m-1 flex ">
                {entry.code} ({entry.time?.toFixed(2)}) {jumpButton}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (reactStackStatus === "rejected") {
    reactStackContent = <div>Error loading dependencies</div>;
  } else if (reactStackStatus === "pending") {
    reactStackContent = <Loader />;
  } else {
    reactStackContent = (
      <div className="m-1 flex grow flex-col border">
        <h3 className="text-sm font-bold">React Component Stack</h3>
        {reactStackValue?.map((entry, index) => {
          const jumpButton = entry.point ? <JumpToDefinitionButton point={entry} /> : null;
          return (
            <div key={index} className="m-1 flex flex-col">
              <div title={entry.parentLocation.url}>
                &lt;{entry.componentName}&gt; {jumpButton}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="react-component-stack flex flex-col">
      <Button className="self-start" onClick={() => setCurrentPoint(point)}>
        Load dependencies
      </Button>
      {reactStackContent}
      {formattedDepGraphContent}
      {depGraphContent}
    </div>
  );
}
