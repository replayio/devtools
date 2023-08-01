import { TimeStampedPoint } from "@replayio/protocol";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { STATUS_PENDING, useImperativeCacheValue } from "suspense";

import ErrorBoundary from "replay-next/components/ErrorBoundary";
import PropertiesRenderer from "replay-next/components/inspector/PropertiesRenderer";
import { SyntaxHighlighter } from "replay-next/components/SyntaxHighlighter/SyntaxHighlighter";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { ParsedToken, parsedTokensToHtml } from "replay-next/src/utils/syntax-parser";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import {
  UserActionEventStack,
  isUserActionTestEvent,
} from "shared/test-suites/RecordingTestMetadata";
import { TestEventDetailsCache } from "ui/components/TestSuite/suspense/TestEventDetailsCache";
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
  } else if (testEvent.data.result == null) {
    return <LoadingFailedMessage />;
  }

  return (
    <ErrorBoundary name="TestEventDetails">
      <UserActionEventDetails
        timeStampedPoint={testEvent.data.result.timeStampedPoint}
        variable={testEvent.data.result.variable}
      />
    </ErrorBoundary>
  );
}

function UserActionEventDetails({
  timeStampedPoint,
  variable,
}: {
  timeStampedPoint: TimeStampedPoint;
  variable: string;
}) {
  const replayClient = useContext(ReplayClientContext);

  const { status, value } = useImperativeCacheValue(
    TestEventDetailsCache,
    replayClient,
    timeStampedPoint,
    variable
  );

  if (status === STATUS_PENDING) {
    return <LoadingInProgress />;
  } else if (value?.props == null || value?.pauseId == null) {
    return <LoadingFailedMessage />;
  }

  return (
    <div className={styles.UserActionEventDetails} data-test-name="UserActionEventDetails">
      <PropertiesRenderer pauseId={value.pauseId} object={value.props} />
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
    <div className={styles.UserActionEventDetails} data-test-name="TestEventDetailsMessage">
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
              className={
                frame.functionName ? styles.StackFrameFunction : styles.StackFrameAnonymousFunction
              }
            >
              {frame.functionName ?? "(anonymous)"}
            </div>
            <div className={styles.StackFrameLocation}>
              {frame.fileName}:{frame.lineNumber}:{frame.columnNumber}
            </div>
          </div>
        ))}
      </div>
      <div className={styles.DetailsTitle}>Test code</div>
      <div className={styles.SourceCodeContainer}>
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
