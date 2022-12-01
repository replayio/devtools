import { createContext, useContext } from "react";

import { AnnotatedTestStep, CypressAnnotationMessage } from "ui/types";

import { TestCaseContext } from "./TestCase";
import { TestStepItem, TestStepItemProps } from "./TestStepItem";

export type TestStepContextType = {
  stepName: string;
  messageEnqueue?: CypressAnnotationMessage;
  messageEnd?: CypressAnnotationMessage;
  point?: string;
  pointEnd?: string;
  startTime: number;
  duration: number;
  parentId?: string;
  error: boolean;
};

export const TestStepContext = createContext<TestStepContextType>(null as any);

type TestStepRootProps = TestStepItemProps & {
  step: AnnotatedTestStep;
};

export function TestStepRoot({ step, ...props }: TestStepRootProps) {
  const { startTime: testStartTime } = useContext(TestCaseContext);

  // some chainers (`then`) don't have a duration, so let's bump it here (+1) so that it shows something in the UI
  const adjustedDuration = step.duration || 1;

  const value = {
    stepName: step.name,
    messageEnqueue: step.annotations.enqueue?.message,
    startTime: testStartTime + step.relativeStartTime,
    messageEnd: step.annotations.end?.message,
    point: step.annotations.enqueue?.point,
    pointEnd: step.annotations.end?.point,
    duration: adjustedDuration,
    parentId: step.parentId,
    error: !!step.error,
  };

  return (
    <TestStepContext.Provider value={value}>
      <TestStepItem {...props} />
    </TestStepContext.Provider>
  );
}
