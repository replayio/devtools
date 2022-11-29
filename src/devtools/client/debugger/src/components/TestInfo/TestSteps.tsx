import React, { useContext, useMemo, useState } from "react";

import { startPlayback } from "ui/actions/timeline";
import Icon from "ui/components/shared/Icon";
import {
  getReporterAnnotationsForTitle,
  getReporterAnnotationsForTitleEnd,
} from "ui/reducers/reporter";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { AnnotatedTestStep, Annotation, TestItem, TestStep } from "ui/types";

import { TestInfoContext } from "./TestInfo";
import { TestStepItem } from "./TestStepItem";

function useGetTestSections(
  steps: TestStep[],
  testTitle: string
): {
  beforeEach: AnnotatedTestStep[];
  testBody: AnnotatedTestStep[];
  afterEach: AnnotatedTestStep[];
} {
  const annotationsEnqueue = useAppSelector(getReporterAnnotationsForTitle(testTitle));
  const annotationsEnd = useAppSelector(getReporterAnnotationsForTitleEnd(testTitle));

  return useMemo(
    () =>
      steps.reduce<{
        beforeEach: AnnotatedTestStep[];
        testBody: AnnotatedTestStep[];
        afterEach: AnnotatedTestStep[];
      }>(
        (acc, step, i) => {
          switch (step.hook) {
            case "beforeEach":
              acc.beforeEach.push({
                ...step,
                annotations: {
                  end: annotationsEnd.find(a => a.message.id === step.id),
                  enqueue: annotationsEnqueue.find(a => a.message.id === step.id),
                },
              });
              break;
            case "afterEach":
              acc.afterEach.push({
                ...step,
                annotations: {
                  end: annotationsEnd.find(a => a.message.id === step.id),
                  enqueue: annotationsEnqueue.find(a => a.message.id === step.id),
                },
              });
              break;
            default:
              acc.testBody.push({
                ...step,
                annotations: {
                  end: annotationsEnd.find(a => a.message.id === step.id),
                  enqueue: annotationsEnqueue.find(a => a.message.id === step.id),
                },
              });
              break;
          }

          return acc;
        },
        { beforeEach: [], testBody: [], afterEach: [] }
      ),
    [steps, annotationsEnd, annotationsEnqueue]
  );
}

export function TestSteps({ test, startTime }: { test: TestItem; startTime: number }) {
  const { selectedId, setSelectedId } = useContext(TestInfoContext);
  const dispatch = useAppDispatch();
  const { beforeEach, testBody, afterEach } = useGetTestSections(test.steps, test.title);
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
    <div className="flex flex-col rounded-lg py-2 pl-11">
      <TestSection
        onReplay={onReplay}
        onPlayFromHere={onPlayFromHere}
        steps={beforeEach}
        startTime={startTime}
        selectedIndex={selectedId}
        setSelectedIndex={setSelectedId}
        header="Before Each"
      />
      <TestSection
        onReplay={onReplay}
        onPlayFromHere={onPlayFromHere}
        steps={testBody}
        startTime={startTime}
        selectedIndex={selectedId}
        setSelectedIndex={setSelectedId}
        header={beforeEach.length + afterEach.length > 0 ? "Test Body" : undefined}
      />
      <TestSection
        onReplay={onReplay}
        onPlayFromHere={onPlayFromHere}
        steps={afterEach}
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
          <div className="wrap space-y-1 overflow-hidden bg-testsuitesErrorBgcolor p-2 font-mono">
            {test.error.message}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TestSection({
  steps,
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
  steps: AnnotatedTestStep[];
  selectedIndex: string | null;
  setSelectedIndex: (index: string | null) => void;
  header?: string;
}) {
  if (steps.length === 0) {
    return null;
  }

  return (
    <>
      {header ? <div className="py-2">{header}</div> : null}
      {steps.map((s, i) => (
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
          isLastStep={steps.length - 1 === i}
          onReplay={onReplay}
          onPlayFromHere={() => onPlayFromHere(startTime + s.relativeStartTime)}
          selectedIndex={selectedIndex}
          setSelectedIndex={setSelectedIndex}
          id={s.id}
        />
      ))}
    </>
  );
}
