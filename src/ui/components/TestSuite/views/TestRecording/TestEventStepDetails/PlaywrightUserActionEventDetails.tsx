import {
  unstable_Offscreen as Offscreen,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { SyntaxHighlighter } from "replay-next/components/SyntaxHighlighter/SyntaxHighlighter";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { ParsedToken, parsedTokensToHtml } from "replay-next/src/utils/syntax-parser";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { UserActionEvent } from "shared/test-suites/RecordingTestMetadata";
import useLocalStorageUserData from "shared/user-data/LocalStorage/useLocalStorageUserData";
import { TestSuiteCache } from "ui/components/TestSuite/suspense/TestSuiteCache";

import { LoadingFailedMessage } from "./TestEventDetailsLoadingMessages";
import { UserActionEventPropsInspector } from "./UserActionEventPropsInspector";
import styles from "./TestEventDetails.module.css";

export function PlaywrightUserActionEventDetails({ testEvent }: { testEvent: UserActionEvent }) {
  const [selectedTab, selectTab] = useLocalStorageUserData("playwrightStepSelectedTab");

  return (
    <div className={styles.TabsContainer}>
      <div className={styles.Tabs}>
        <button
          className={styles.Tab}
          data-active={selectedTab === "elements" || undefined}
          onClick={() => selectTab("elements")}
        >
          Elements
        </button>
        <button
          className={styles.Tab}
          data-active={selectedTab === "source" || undefined}
          onClick={() => selectTab("source")}
        >
          Source
        </button>
      </div>

      <div className={styles.UserActionEventDetails}>
        <Offscreen mode={selectedTab === "elements" ? "visible" : "hidden"}>
          {testEvent.data.timeStampedPoints.result ? (
            <UserActionEventPropsInspector testEvent={testEvent} />
          ) : (
            <LoadingFailedMessage />
          )}
        </Offscreen>
        <Offscreen mode={selectedTab === "source" ? "visible" : "hidden"}>
          <PlaywrightStepSources testEvent={testEvent} />
        </Offscreen>
      </div>
    </div>
  );
}

function PlaywrightStepSources({ testEvent }: { testEvent: UserActionEvent }) {
  const replayClient = useContext(ReplayClientContext);
  const { recordingId } = useContext(SessionContext);

  const [stackFrameIndex, setStackFrameIndex] = useState(0);

  const stack = testEvent.data.testSourceCallStack;
  let topFrame = stack?.[stackFrameIndex];
  let sourceCode: string | null = null;

  const lineRenderer = useCallback(
    ({ lineNumber, tokens }: { lineNumber: number; tokens: ParsedToken[] }) => (
      <SyntaxHighlighterLine
        isSelected={topFrame?.lineNumber === lineNumber}
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

  if (!sourceCode || !stack) {
    return <LoadingFailedMessage />;
  }

  return (
    <div className={styles.UserActionEventDetails} data-test-name="UserActionEventDetails">
      <div className={styles.DetailsTitle}>Call stack</div>
      <div className={styles.CallStack}>
        {stack?.map((frame, index) => (
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
