import { PropsWithChildren, createContext, useCallback, useMemo, useState } from "react";

export type Coordinates = {
  x: number;
  y: number;
};

export type TestCaseType = {
  startTime: number;
  endTime: number;
};
export type TestStepType = TestCaseType & {
  enqueuePoint?: string;
};

export type TestInfoContextMenuContextType = {
  hide: () => void;
  show: (mouseCoordinates: Coordinates, testCase: TestCaseType, testStep: TestStepType) => void;
  mouseCoordinates: Coordinates | null;
  testStep: TestStepType | null;
  testCase: TestCaseType | null;
};

export const TestInfoContextMenuContext = createContext<TestInfoContextMenuContextType>(
  null as any
);

export function TestInfoContextMenuContextRoot({ children }: PropsWithChildren) {
  const [mouseCoordinates, setMouseCoordinates] = useState<Coordinates | null>(null);
  const [testStep, setTestStep] = useState<TestStepType | null>(null);
  const [testCase, setTestCase] = useState<TestCaseType | null>(null);

  const hide = useCallback(() => {
    setMouseCoordinates(null);
    setTestStep(null);
    setTestCase(null);
  }, []);

  const show = useCallback(
    (mouseCoordinates: Coordinates, testCase: TestCaseType, testStep: TestStepType) => {
      setMouseCoordinates(mouseCoordinates);
      setTestStep(testStep);
      setTestCase(testCase);
    },
    []
  );

  const context = useMemo(
    () => ({
      hide,
      mouseCoordinates,
      show,
      testStep,
      testCase,
    }),
    [hide, mouseCoordinates, show, testStep, testCase]
  );

  return (
    <TestInfoContextMenuContext.Provider value={context}>
      {children}
    </TestInfoContextMenuContext.Provider>
  );
}
