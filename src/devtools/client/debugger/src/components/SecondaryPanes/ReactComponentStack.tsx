import { ExecutionPoint, TimeStampedPoint } from "@replayio/protocol";
import React, { useContext, useState } from "react";
import { useImperativeCacheValue } from "suspense";

import { Button } from "replay-next/components/Button";
import Expandable from "replay-next/components/Expandable";
import Icon from "replay-next/components/Icon";
import Loader from "replay-next/components/Loader";
import { JsonViewer } from "replay-next/components/SyntaxHighlighter/JsonViewer";
import { useMostRecentLoadedPause } from "replay-next/src/hooks/useMostRecentLoadedPause";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { DependencyGraphMode } from "shared/client/types";
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

function ReactComponentStack({ point }: { point?: TimeStampedPoint }) {
  const replayClient = useContext(ReplayClientContext);
  const { status: reactStackStatus, value: reactStackValue } = useImperativeCacheValue(
    reactComponentStackCache,
    replayClient,
    point ?? null
  );

  if (!point) {
    return null;
  }

  let reactStackContent: React.ReactNode = undefined;

  if (reactStackStatus === "rejected") {
    reactStackContent = <div>Error loading dependencies</div>;
  } else if (reactStackStatus === "pending") {
    reactStackContent = <Loader />;
  } else {
    const firstItem = reactStackValue?.[0];
    reactStackContent = (
      <div className="m-1 flex grow flex-col border">
        <h3 className="text-base font-bold">React Component Stack</h3>
        {/* Show the _current_ location, by itself */}
        {firstItem && (
          <div className="m-1 flex flex-col">
            <div title={firstItem.componentLocation?.url}>
              {firstItem.componentName} ({point.time.toFixed(2)}){" "}
              <JumpToDefinitionButton point={point} />
            </div>
          </div>
        )}
        {reactStackValue?.map((entry, index) => {
          const jumpButton = entry.point ? <JumpToDefinitionButton point={entry} /> : null;
          return (
            <div key={index} className="m-1 flex flex-col">
              <div title={entry.parentLocation?.url}>
                {/* Show the parent->child rendering relationship */}
                {entry.parentComponentName} &#8594; &lt;{entry.componentName}&gt; (
                {entry.time?.toFixed(2)}) {jumpButton}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return <div className="react-component-stack flex flex-col">{reactStackContent}</div>;
}

function DepGraphDisplay({
  point,
  mode,
  title,
}: {
  point?: ExecutionPoint;
  mode?: DependencyGraphMode;
  title: string;
}) {
  const replayClient = useContext(ReplayClientContext);

  const { status: depGraphStatus, value: depGraphValue } = useImperativeCacheValue(
    depGraphCache,
    replayClient,
    point ?? null,
    mode ?? null
  );

  let depGraphContent: React.ReactNode = undefined;
  let formattedDepGraphContent: React.ReactNode = undefined;

  if (depGraphStatus === "rejected") {
    depGraphContent = <div>Error loading dependencies</div>;
  } else if (depGraphStatus === "pending") {
    depGraphContent = <Loader />;
  } else {
    const valueDescending = depGraphValue?.slice().reverse();

    depGraphContent = (
      <div className="m-1 grow border ">
        <Expandable header={<h4 className="inline text-sm font-bold">Dependency Graph JSON</h4>}>
          <JsonViewer jsonText={JSON.stringify(valueDescending, null, 2)} />
        </Expandable>
      </div>
    );

    formattedDepGraphContent = (
      <div className="m-1 grow border ">
        <h4 className="text-sm font-bold">Dependency Graph Formatted</h4>
        <div className="m-1 flex flex-col">
          {valueDescending?.map((entry, index) => {
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

  return (
    <div className="react-component-stack m-1 flex flex-col">
      <h3 className="text-base font-bold">{title}</h3>
      {formattedDepGraphContent}
      {depGraphContent}
    </div>
  );
}

export function DepGraphPrototypePanel() {
  const { point, time, pauseId } = useMostRecentLoadedPause() ?? {};
  const replayClient = useContext(ReplayClientContext);
  const [currentPoint, setCurrentPoint] = useState<TimeStampedPoint | null>(null);

  if (!pauseId || !point || !time) {
    return <div>Not paused at a point</div>;
  }

  return (
    <div className="react-component-stack flex flex-col">
      <Button className="self-start" onClick={() => setCurrentPoint({ point, time })}>
        Load dependencies
      </Button>
      <ReactComponentStack point={currentPoint ?? undefined} />
      <DepGraphDisplay point={currentPoint?.point} title="Dep Graph (Regular)" />
      <DepGraphDisplay
        point={point}
        mode={DependencyGraphMode.ReactParentRenders}
        title="Dep Graph (React)"
      />
    </div>
  );
}
