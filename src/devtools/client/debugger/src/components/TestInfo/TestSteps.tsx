import React, { useCallback, useContext, useMemo, useState } from "react";

import { startPlayback } from "ui/actions/timeline";
import {
  RequestSummary,
  partialRequestsToCompleteSummaries,
} from "ui/components/NetworkMonitor/utils";
import Icon from "ui/components/shared/Icon";
import { getEvents, getRequests } from "ui/reducers/network";
import {
  getReporterAnnotationsForTitle,
  getReporterAnnotationsForTitleEnd,
  getReporterAnnotationsForTitleNavigation,
} from "ui/reducers/reporter";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { AnnotatedTestStep, CypressAnnotationMessage, TestItem, TestStep } from "ui/types";

import { NetworkEvent } from "./NetworkEvent";
import { TestInfoContext } from "./TestInfo";
import { TestInfoContextMenuContext } from "./TestInfoContextMenuContext";
import { TestStepItem } from "./TestStepItem";

type StepEvent = {
  time: number;
  type: "step";
  event: AnnotatedTestStep;
};
type NetworkEvent = {
  time: number;
  type: "network";
  event: RequestSummary;
};
type NavigationEvent = {
  time: number;
  type: "navigation";
  event: CypressAnnotationMessage;
};

type CompositeTestEvent = StepEvent | NetworkEvent | NavigationEvent;

function useGetTestSections(
  startTime: number,
  steps: TestStep[],
  testTitle: string
): {
  beforeEach: CompositeTestEvent[];
  testBody: CompositeTestEvent[];
  afterEach: CompositeTestEvent[];
} {
  const navigationEvents = useAppSelector(getReporterAnnotationsForTitleNavigation(testTitle));
  const annotationsEnqueue = useAppSelector(getReporterAnnotationsForTitle(testTitle));
  const annotationsEnd = useAppSelector(getReporterAnnotationsForTitleEnd(testTitle));
  const requests = useAppSelector(getRequests);
  const events = useAppSelector(getEvents);

  return useMemo(() => {
    const times = steps.reduce(
      (acc, s) =>
        typeof s.relativeStartTime === "number" && typeof s.duration === "number"
          ? {
              min: Math.min(acc.min, startTime + s.relativeStartTime),
              max: Math.max(acc.max, startTime + s.relativeStartTime + s.duration),
            }
          : acc,
      { min: Infinity, max: 0 }
    );

    const isDuringSteps = (time: number) => {
      return time >= times.min && time < times.max;
    };

    const networkDataByTime = partialRequestsToCompleteSummaries(requests, events, new Set())
      .filter(n => {
        return (n.cause === "xhr" || n.cause === "fetch") && n.end != null && isDuringSteps(n.end);
      })
      .map<NetworkEvent>(n => ({ time: n.end!, type: "network", event: n }));

    const stepsByTime = steps.map<StepEvent>(s => ({
      time: startTime + s.relativeStartTime + s.duration,
      type: "step",
      event: {
        ...s,
        annotations: {
          end: annotationsEnd.find(a => a.message.id === s.id),
          enqueue: annotationsEnqueue.find(a => a.message.id === s.id),
        },
      },
    }));

    const navigationEventsByTime = navigationEvents
      .filter(e => isDuringSteps(e.time))
      .map<NavigationEvent>(n => ({ time: n.time, type: "navigation", event: n.message }));

    const allEvents = [...networkDataByTime, ...stepsByTime, ...navigationEventsByTime].sort(
      (a, b) => {
        if (a.type === "step" && b.type === "step" && a.event.hook !== b.event.hook) {
          // sort steps by hook first and then by time if they're the same
          if (a.event.hook === "beforeEach" && b.event.hook !== "beforeEach") {
            return -1;
          } else if (a.event.hook === "afterEach" && b.event.hook !== "afterEach") {
            return 1;
          }
        }

        return a.time - b.time;
      }
    );

    const beforeEach: CompositeTestEvent[] = [];
    const testBody: CompositeTestEvent[] = [];
    const afterEach: CompositeTestEvent[] = [];

    let currentStack: CompositeTestEvent[] = beforeEach;
    let nonStepStack: CompositeTestEvent[] = [];

    for (let e of allEvents) {
      if (e.type === "step") {
        let stackChanged = false;
        if (e.event.hook === "beforeEach") {
          stackChanged = currentStack !== beforeEach;
          currentStack = beforeEach;
        } else if (e.event.hook === "afterEach") {
          stackChanged = currentStack !== afterEach;
          currentStack = afterEach;
        } else if (!e.event.hook) {
          stackChanged = currentStack !== testBody;
          currentStack = testBody;
        }

        if (!stackChanged) {
          currentStack.push(...nonStepStack.splice(0, nonStepStack.length));
        }

        currentStack.push(e);
        currentStack.push(...nonStepStack.splice(0, nonStepStack.length));
      } else {
        if (currentStack.length !== 0) {
          nonStepStack.push(e);
        }
      }
    }

    return { beforeEach, testBody, afterEach };
  }, [steps, annotationsEnd, annotationsEnqueue, requests, events, startTime, navigationEvents]);
}

export function TestSteps({ test, startTime }: { test: TestItem; startTime: number }) {
  const { selectedId, setSelectedId } = useContext(TestInfoContext);
  const dispatch = useAppDispatch();
  const { beforeEach, testBody, afterEach } = useGetTestSections(startTime, test.steps, test.title);
  const testStart = test.steps[0].relativeStartTime + startTime;
  const testEnd =
    test.steps[test.steps.length - 1].relativeStartTime +
    startTime +
    test.steps[test.steps.length - 1].duration;

  const onReplay = () => {
    dispatch(startPlayback({ beginTime: testStart, endTime: testEnd - 1 }));
  };
  const onPlayFromHere = (beginTime: number) => {
    dispatch(startPlayback({ beginTime, endTime: testEnd - 1 }));
  };

  return (
    <div className="flex flex-col rounded-lg py-2 px-2">
      <TestSection
        onReplay={onReplay}
        onPlayFromHere={onPlayFromHere}
        events={beforeEach}
        startTime={startTime}
        selectedIndex={selectedId}
        setSelectedIndex={setSelectedId}
        header="Before Each"
      />
      <TestSection
        onReplay={onReplay}
        onPlayFromHere={onPlayFromHere}
        events={testBody}
        startTime={startTime}
        selectedIndex={selectedId}
        setSelectedIndex={setSelectedId}
        header={beforeEach.length + afterEach.length > 0 ? "Test Body" : undefined}
      />
      <TestSection
        onReplay={onReplay}
        onPlayFromHere={onPlayFromHere}
        events={afterEach}
        startTime={startTime}
        selectedIndex={selectedId}
        setSelectedIndex={setSelectedId}
        header="After Each"
      />
      {test.error ? (
        <div className="border-l-2 border-red-500 bg-testsuitesErrorBgcolor text-testsuitesErrorColor">
          <div className="flex flex-row items-center space-x-1 p-2">
            <Icon filename="warning" size="small" className="bg-testsuitesErrorColor" />
            <div className="font-bold">Error</div>
          </div>
          <div className="wrap space-y-1 overflow-hidden p-2 font-mono">{test.error.message}</div>
        </div>
      ) : null}
    </div>
  );
}

function TestSection({
  events,
  startTime,
  header,
  onPlayFromHere,
  onReplay,
  selectedIndex,
  setSelectedIndex,
}: {
  onPlayFromHere: (time: number) => void;
  onReplay: () => void;
  startTime: number;
  events: CompositeTestEvent[];
  selectedIndex: string | null;
  setSelectedIndex: (index: string | null) => void;
  header?: string;
}) {
  if (events.length === 0) {
    return null;
  }

  return (
    <>
      {header ? (
        <div
          className="pt-6 pb-2 pl-2  font-semibold uppercase opacity-50"
          style={{ fontSize: "10px" }}
        >
          {header}
        </div>
      ) : null}
      {events.map(({ event: s, type }, i) =>
        type === "step" ? (
          <TestStepItem
            stepName={s.name}
            messageEnqueue={s.annotations.enqueue?.message}
            messageEnd={s.annotations.end?.message}
            point={s.annotations.enqueue?.point}
            pointEnd={s.annotations.end?.point}
            key={i}
            index={i}
            startTime={startTime + s.relativeStartTime}
            duration={s.duration}
            argString={s.args?.toString()}
            parentId={s.parentId}
            error={!!s.error}
            isLastStep={events.length - 1 === i}
            onReplay={onReplay}
            onPlayFromHere={() => onPlayFromHere(startTime + s.relativeStartTime)}
            selectedIndex={selectedIndex}
            setSelectedIndex={setSelectedIndex}
            id={s.id}
          />
        ) : type === "network" ? (
          <NetworkEvent key={s.id} method={s.method} status={s.status} url={s.url} id={s.id} />
        ) : (
          <span className="font-italic flex border-b border-themeBase-90 p-1 px-2">
            new url {s.url}
          </span>
        )
      )}
    </>
  );
}
