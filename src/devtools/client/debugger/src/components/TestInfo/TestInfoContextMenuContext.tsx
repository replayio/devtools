import { PropsWithChildren, createContext, useCallback, useMemo, useState } from "react";

import { AnnotatedTestStep, TestItem } from "shared/graphql/types";

export type Coordinates = {
  x: number;
  y: number;
};

export type TestInfoContextMenuContextType = {
  hide: () => void;
  show: (mouseCoordinates: Coordinates, testCase: TestItem, testStep: AnnotatedTestStep) => void;
  mouseCoordinates: Coordinates | null;
  testStep: AnnotatedTestStep | null;
  testCase: TestItem | null;
};

export const TestInfoContextMenuContext = createContext<TestInfoContextMenuContextType>(
  null as any
);

export function TestInfoContextMenuContextRoot({ children }: PropsWithChildren) {
  const [mouseCoordinates, setMouseCoordinates] = useState<Coordinates | null>(null);
  const [testStep, setTestStep] = useState<AnnotatedTestStep | null>(null);
  const [testCase, setTestCase] = useState<TestItem | null>(null);

  const hide = useCallback(() => {
    setMouseCoordinates(null);
    setTestStep(null);
    setTestCase(null);
  }, []);

  const show = useCallback(
    (mouseCoordinates: Coordinates, testCase: TestItem, testStep: AnnotatedTestStep) => {
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
