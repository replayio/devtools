import React, { useContext, useMemo } from "react";

import {
  AnnotatedTestStep,
  CypressAnnotationMessage,
  TestItem,
  TestStep,
} from "shared/graphql/types";
import { seekToTime } from "ui/actions/timeline";
import {
  RequestSummary,
  partialRequestsToCompleteSummaries,
} from "ui/components/NetworkMonitor/utils";
import Icon from "ui/components/shared/Icon";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { getEvents, getRequests } from "ui/reducers/network";
import {
  getReporterAnnotationsForTitle,
  getReporterAnnotationsForTitleEnd,
  getReporterAnnotationsForTitleNavigation,
  getReporterAnnotationsForTitleStart,
} from "ui/reducers/reporter";
import { getCurrentTime } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import { NetworkEvent } from "./NetworkEvent";
import { TestCaseContext } from "./TestCase";
import { TestStepItem } from "./TestStepItem";
import { TestStepRow } from "./TestStepRow";

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
  steps?: TestStep[]
): {
  beforeEach: CompositeTestEvent[];
  testBody: CompositeTestEvent[];
  afterEach: CompositeTestEvent[];
} {
  const navigationEvents = useAppSelector(getReporterAnnotationsForTitleNavigation);
  const annotationsEnqueue = useAppSelector(getReporterAnnotationsForTitle);
  const annotationsEnd = useAppSelector(getReporterAnnotationsForTitleEnd);
  const annotationsStart = useAppSelector(getReporterAnnotationsForTitleStart);
  const requests = useAppSelector(getRequests);
  const events = useAppSelector(getEvents);

  return useMemo(() => {
    const simplifiedSteps = steps?.reduce<TestStep[]>((acc, s) => {
      const previous = acc[acc.length - 1];
      if (s.name === "then") {
        return acc;
      } else if (previous && s.name === "as" && typeof s.args?.[0] === "string") {
        acc[acc.length - 1] = {
          ...previous,
          alias: s.args[0],
        };
      } else {
        acc.push(s);
      }

      return acc;
    }, []);

    const stepsByTime =
      simplifiedSteps?.map<StepEvent>((s, i) => {
        const annotations = {
          end: annotationsEnd.find(a => a.message.id === s.id),
          enqueue: annotationsEnqueue.find(a => a.message.id === s.id),
          start: annotationsStart.find(a => a.message.id === s.id),
        };

        let duration = s.duration || 1;
        let absoluteStartTime = annotations.start?.time ?? startTime + (s.relativeStartTime || 0);
        let absoluteEndTime = annotations.end?.time ?? absoluteStartTime + duration;

        if (s.name === "assert") {
          // start failed asserts at their end time so they line up with the end
          // of the failed command but successful asserts with their start time
          if (s.error) {
            absoluteStartTime = absoluteEndTime - 1;
          } else {
            absoluteEndTime = absoluteStartTime + 1;
          }
          duration = 1;
        }

        return {
          time: absoluteStartTime,
          type: "step",
          event: {
            ...s,
            relativeStartTime: s.relativeStartTime,
            absoluteStartTime,
            absoluteEndTime: Math.max(0, absoluteEndTime - 1),
            duration,
            index: i,
            annotations,
          },
        };
      }) || [];

    const times = stepsByTime.reduce(
      (acc, s) => ({
        min: Math.min(acc.min, s.event.absoluteStartTime),
        max: Math.max(acc.max, s.event.absoluteEndTime),
      }),
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

    if (nonStepStack.length) {
      if (afterEach.length) {
        afterEach.push(...nonStepStack);
      } else if (testBody.length) {
        testBody.push(...nonStepStack);
      } else if (beforeEach.length) {
        beforeEach.push(...nonStepStack);
      }
    }

    return { beforeEach, testBody, afterEach };
  }, [
    steps,
    annotationsEnd,
    annotationsEnqueue,
    requests,
    events,
    startTime,
    navigationEvents,
    annotationsStart,
  ]);
}

export function TestSteps({ test }: { test: TestItem }) {
  const { startTime: testCaseStartTime } = useContext(TestCaseContext);
  const { beforeEach, testBody, afterEach } = useGetTestSections(testCaseStartTime, test.steps);
  const autoSelectId =
    test.steps?.find(s => !!s.error)?.id ||
    (beforeEach[0] || testBody[0] || afterEach[0])?.event?.id;

  return (
    <div className="flex flex-col rounded-lg px-2">
      <TestSection events={beforeEach} header="Before Each" autoSelectId={autoSelectId} />
      <TestSection
        events={testBody}
        header={beforeEach.length + afterEach.length > 0 ? "Test Body" : undefined}
        autoSelectId={autoSelectId}
      />
      <TestSection events={afterEach} header="After Each" autoSelectId={autoSelectId} />
      {test.error ? (
        <TestStepRow error>
          <div>
            <div className="flex flex-row items-center space-x-1 p-2">
              <Icon filename="warning" size="small" className="bg-testsuitesErrorColor" />
              <div className="font-bold">Assertion Error</div>
            </div>
            <div className="wrap space-y-1 overflow-hidden p-2 font-mono">{test.error.message}</div>
          </div>
        </TestStepRow>
      ) : null}
    </div>
  );
}

function NewUrlRow({ time, message }: { time: number; message: CypressAnnotationMessage }) {
  const currentTime = useAppSelector(getCurrentTime);
  const dispatch = useAppDispatch();

  const onClick = () => {
    dispatch(seekToTime(time));
  };

  return (
    <TestStepRow
      active={time === currentTime}
      pending={time > currentTime}
      key={(message.url || "url") + time}
      onClick={onClick}
      className="cursor-pointer"
    >
      <MaterialIcon className="mr-1 opacity-70" iconSize="sm">
        navigation
      </MaterialIcon>
      <div className="truncate italic opacity-70" title={message.url}>
        {message.url}
      </div>
    </TestStepRow>
  );
}

function TestSection({
  events,
  header,
  autoSelectId,
}: {
  events: CompositeTestEvent[];
  header?: string;
  autoSelectId?: string;
}) {
  const firstStep = events.find((e): e is StepEvent => e.type === "step");
  const firstIndex = firstStep?.event.index || 0;

  if (events.length === 0) {
    return null;
  }

  return (
    <>
      {header ? (
        <div
          data-test-id="TestSuites-TestCase-SectionHeader"
          className="pt-6 pb-2  font-semibold uppercase opacity-50 first:pt-0"
          style={{ fontSize: "10px" }}
        >
          {header}
        </div>
      ) : null}
      {events.map(({ event: s, type, time }, i) =>
        type === "step" ? (
          <TestStepItem
            step={s}
            key={s.id}
            index={s.index - firstIndex}
            argString={
              s.args ? s.args.filter((s): s is string => s && typeof s === "string").join(", ") : ""
            }
            id={s.id}
            autoSelect={s.id === autoSelectId}
          />
        ) : type === "network" ? (
          <NetworkEvent key={s.id} request={s} />
        ) : (
          <NewUrlRow message={s} time={time} key={s.id} />
        )
      )}
    </>
  );
}
