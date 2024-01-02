import { ExecutionPoint, TimeStampedPoint } from "@replayio/protocol";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Cache, STATUS_PENDING, useImperativeCacheValue } from "suspense";

import { InlineErrorBoundary } from "replay-next/components/errors/InlineErrorBoundary";
import PropertiesRenderer from "replay-next/components/inspector/PropertiesRenderer";
import { SyntaxHighlighter } from "replay-next/components/SyntaxHighlighter/SyntaxHighlighter";
import { InspectableTimestampedPointContext } from "replay-next/src/contexts/InspectorContext";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { ParsedToken, parsedTokensToHtml } from "replay-next/src/utils/syntax-parser";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import {
  UserActionEventStack,
  isUserActionTestEvent,
} from "shared/test-suites/RecordingTestMetadata";
import {
  TestEventDetailsEntry,
  testEventDetailsResultsCache,
} from "ui/components/TestSuite/suspense/TestEventDetailsCache";
import { TestSuiteCache } from "ui/components/TestSuite/suspense/TestSuiteCache";
import { TestSuiteContext } from "ui/components/TestSuite/views/TestSuiteContext";

import styles from "./TestEventDetails.module.css";

export default function TestEventDetails({ collapsed }: { collapsed: boolean }) {
  const { testEvent } = useContext(TestSuiteContext);

  if (collapsed) {
    return null;
  } else if (testEvent == null || !isUserActionTestEvent(testEvent)) {
    return <SelectionPrompt />;
  } else if (testEvent.data.testSourceCallStack !== null) {
    return (
      <PlaywrightUserActionEventDetails
        key={testEvent.data.id}
        stack={testEvent.data.testSourceCallStack}
      />
    );
  } else if (!testEvent.data.resultVariable || !testEvent.data.timeStampedPoints.result) {
    return <LoadingFailedMessage />;
  }

  return (
    <InlineErrorBoundary name="TestEventDetails">
      <UserActionEventDetails
        timeStampedPoint={testEvent.data.timeStampedPoints.result}
        variable={testEvent.data.resultVariable}
      />
    </InlineErrorBoundary>
  );
}

function UserActionEventDetails({
  timeStampedPoint,
  variable,
}: {
  timeStampedPoint: TimeStampedPoint;
  variable: string;
}) {
  const { status, value } = useImperativeCacheValue(
    testEventDetailsResultsCache as unknown as Cache<
      [executionPoint: ExecutionPoint],
      TestEventDetailsEntry
    >,
    timeStampedPoint.point
  );

  const context = useMemo(
    () => ({
      executionPoint: timeStampedPoint.point,
      time: timeStampedPoint.time,
    }),
    [timeStampedPoint]
  );

  if (status === STATUS_PENDING) {
    return <LoadingInProgress />;
  } else if (value?.props == null || value?.pauseId == null) {
    return <LoadingFailedMessage />;
  }

  return (
    <div className={styles.UserActionEventDetails} data-test-name="UserActionEventDetails">
      <InspectableTimestampedPointContext.Provider value={context}>
        <PropertiesRenderer pauseId={value.pauseId} object={value.props} />
      </InspectableTimestampedPointContext.Provider>
    </div>
  );
}

function LoadingFailedMessage() {
  return (
    <div className={styles.Message} data-test-name="TestEventDetailsMessage">
      Unable to retrieve details for this step
    </div>
  );
}

function LoadingInProgress() {
  return (
    <div className={styles.Message} data-test-name="TestEventDetailsMessage">
      Loading...
    </div>
  );
}

function PlaywrightUserActionEventDetails({ stack }: { stack: UserActionEventStack }) {
  const replayClient = useContext(ReplayClientContext);
  const { recordingId } = useContext(SessionContext);

  const [stackFrameIndex, setStackFrameIndex] = useState(0);

  let topFrame = stack[stackFrameIndex];
  let sourceCode: string | null = null;

  const lineRenderer = useCallback(
    ({ lineNumber, tokens }: { lineNumber: number; tokens: ParsedToken[] }) => (
      <SyntaxHighlighterLine
        isSelected={topFrame.lineNumber === lineNumber}
        key={lineNumber}
        tokens={tokens}
      />
    ),
    [topFrame]
  );

  if (topFrame) {
    const groupedTestCases = TestSuiteCache.read(replayClient, recordingId);
    if (groupedTestCases?.testSources != null) {
      sourceCode = groupedTestCases.testSources[topFrame.fileName];
    }
  }

  if (!sourceCode) {
    return (
      <div className={styles.Message} data-test-name="TestEventDetailsMessage">
        Unable to display details for this step
      </div>
    );
  }

  return (
    <div className={styles.UserActionEventDetails} data-test-name="UserActionEventDetails">
      <div className={styles.DetailsTitle}>Call stack</div>
      <div className={styles.CallStack}>
        {stack.map((frame, index) => (
          <div
            key={index}
            className={styles.StackFrame}
            data-selected={index === stackFrameIndex || undefined}
            onClick={() => setStackFrameIndex(index)}
          >
            <div
              data-test-name="TestEventDetailsCallStackFrame"
              className={
                frame.functionName ? styles.StackFrameFunction : styles.StackFrameAnonymousFunction
              }
            >
              {frame.functionName ?? "(anonymous)"}
            </div>
            <div
              className={styles.StackFrameLocation}
              data-test-name="TestEventDetailsCallStackFile"
            >
              {frame.fileName}:{frame.lineNumber}:{frame.columnNumber}
            </div>
          </div>
        ))}
      </div>
      <div className={styles.DetailsTitle}>Test code</div>
      <div className={styles.SourceCodeContainer} data-test-name="TestEventDetailsCode">
        <SyntaxHighlighter code={sourceCode} lineRenderer={lineRenderer} fileExtension=".js" />
      </div>
    </div>
  );
}

function SelectionPrompt() {
  return (
    <div className={styles.Message} data-test-name="TestEventDetailsMessage">
      Select an action above to view its details
    </div>
  );
}

export function SyntaxHighlighterLine({
  isSelected,
  tokens,
}: {
  isSelected: boolean;
  tokens: ParsedToken[];
}) {
  const ref = useRef<HTMLDivElement>(null);

  const html = parsedTokensToHtml(tokens);

  const className = isSelected ? styles.SourceCodeLineSelected : styles.SourceCodeLine;

  useEffect(() => {
    if (isSelected) {
      const div = ref.current;
      if (div) {
        div.scrollIntoView({ behavior: "auto", block: "center" });
      }
    }
  }, [isSelected]);

  return (
    <div
      className={`${styles.Line} ${className}`}
      dangerouslySetInnerHTML={{ __html: html || "&nbsp;" }}
      ref={ref}
    />
  );
}
