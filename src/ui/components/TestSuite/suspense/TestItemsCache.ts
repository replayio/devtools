import assert from "assert";
import { RecordingId, RequestEventInfo, RequestInfo } from "@replayio/protocol";
import { createSingleEntryCache } from "suspense";

import { findInsertIndex } from "replay-next/src/utils/array";
import { compareNumericStrings } from "replay-next/src/utils/string";
import { Annotation, TestItemError, TestStep, TestStepHook } from "shared/graphql/types";
import { partialRequestsToCompleteSummaries } from "ui/components/NetworkMonitor/utils";
import { AnnotationsCache } from "ui/components/TestSuite/suspense/AnnotationsCache";
import { RecordingCache } from "ui/components/TestSuite/suspense/RecordingCache";
import {
  ProcessedTestItem,
  ProcessedTestItemAnnotations,
  ProcessedTestItemSections,
  ProcessedTestStep,
} from "ui/components/TestSuite/types";
import validateTestMetadata from "ui/components/TestSuite/utils/validateTestMetadata";
import { pingTelemetry } from "ui/utils/replay-telemetry";

// Processes TestItems into a format more usable by the TestSuite UI.
// This cache depends on both Recording (from GraphQL) and annotations data (from the Replay protocol) and may load slowly.
export const TestItemsCache = createSingleEntryCache<
  [recordingId: RecordingId, requestInfo: RequestInfo[], requestEventInfo: RequestEventInfo[]],
  ProcessedTestItem[]
>({
  debugLabel: "ProcessedTestItem",
  load: async ([recordingId, requestInfo, requestEventInfo]) => {
    const startTime = Date.now();
    const recording = await RecordingCache.readAsync(recordingId);
    const testMetadata = validateTestMetadata(recording);

    const annotations = await AnnotationsCache.readAsync();

    const { tests: testItems = [] } = testMetadata;

    const startAnnotations = annotations.filter(({ message }) => message.event === "test:start");

    const testItemResults = testItems.map((testItem, index) => {
      const { path = [], steps = [], ...rest } = testItem;

      const endMap = new Map<string, Annotation>();
      const enqueue: Annotation[] = [];
      const navigationEvents: Annotation[] = [];
      const start: Annotation[] = [];

      annotations.forEach(annotation => {
        const { message, point } = annotation;
        const { event, id, titlePath } = message;
        if (titlePath[titlePath.length - 1] === testItem.title) {
          switch (event) {
            case "step:end":
              if (id) {
                const previous = endMap.get(id);
                if (previous == null || compareNumericStrings(previous.point, point) > 0) {
                  endMap.set(id, annotation);
                }
              }
              break;
            case "step:enqueue":
              enqueue.push(annotation);
              break;
            case "event:navigation":
              navigationEvents.push(annotation);
            case "step:start":
              start.push(annotation);
              break;
          }
        }
      });

      // Test item start times are unreliable.
      // If we have the reporter annotations, use their start time instead.
      const relativeStartTime = startAnnotations[index]
        ? startAnnotations[index].time
        : testItem.relativeStartTime ?? 0;

      const testItemAnnotations: ProcessedTestItemAnnotations = {
        end: Array.from(endMap.values()),
        enqueue,
        navigationEvents,
        start,
      };

      // A "path" to a test (the code in the it() block) consists of:
      // * an empty string (why?)
      // * a runtime identifier
      // * a path name
      // * 0 or more describe() block titles
      // * an it() block title
      //
      // HACK For some tests (Playwright ones at least) the Path only contains the first 3 entries (no title)
      const [_, runtime, filePath, ...scopePath] = path;
      if (scopePath.length > 0) {
        const title = scopePath.pop();
        assert(title === testItem.title, "Test item title does not match path");
      }

      const sections = createSections(
        relativeStartTime,
        testItemAnnotations,
        steps,
        requestInfo,
        requestEventInfo
      );

      // Although TestItem has an "error" field,
      // the TestStep error has more information (and is formatted in a better way for display)
      // so we should use that instead (if it exists).
      let error: TestItemError | undefined = undefined;
      let testItemDuration = 0;
      steps.forEach(step => {
        testItemDuration += step.duration;
        if (error === undefined && step.error) {
          error = step.error;
        }
      });
      if (error === undefined) {
        error = testItem.error;
      }

      return {
        ...rest,
        annotations: testItemAnnotations,
        duration: testItem.duration ?? testItemDuration,
        error,
        filePath,
        relativeStartTime,
        runtime,
        sections,
        scopePath,
      };
    });

    pingTelemetry("TestItemsCacheLoad", {
      duration: Date.now() - startTime,
      recordingId,
    });
    return testItemResults;
  },
});

function createSections(
  testItemRelativeStartTime: number,
  testItemAnnotations: ProcessedTestItemAnnotations,
  testSteps: TestStep[],
  requestInfo: RequestInfo[],
  requestEventInfo: RequestEventInfo[]
): ProcessedTestItemSections {
  const mappedSteps: TestStep[] = [];
  testSteps?.forEach(testStep => {
    if (testStep.name === "then") {
      return; // Ignore
    }

    const previousStep = mappedSteps[mappedSteps.length - 1];
    if (previousStep) {
      if (testStep.name === "as" && typeof testStep.args?.[0] === "string") {
        // TestItem testSteps are immutable, so we need to clone if we're going to "modify" one
        mappedSteps[mappedSteps.length - 1] = {
          ...previousStep,
          alias: testStep.args[0],
        };
        return;
      }
    }

    mappedSteps.push(testStep);
  });

  const processedTestSteps: ProcessedTestStep[] = [];

  // Test steps should be sorted by group:
  // beforeAll
  // beforeEach
  // test body
  // afterEach
  // afterAll
  const getHookWeight = (hook: TestStepHook | undefined) => {
    switch (hook) {
      case "beforeAll":
        return 1;
      case "beforeEach":
        return 2;
      case "afterEach":
        return 4;
      case "afterAll":
        return 5;
      default:
        // Test body
        return 3;
    }
  };

  const insertProcessedTestStep = (processedTestStep: ProcessedTestStep) => {
    processedTestSteps.splice(
      findInsertIndex<ProcessedTestStep>(
        processedTestSteps,
        processedTestStep,
        (a: ProcessedTestStep, b: ProcessedTestStep) => {
          if (a.type === "step" && b.type === "step") {
            const hookWeightA = getHookWeight(a.data.hook);
            const hookWeightB = getHookWeight(b.data.hook);
            if (hookWeightA !== hookWeightB) {
              return hookWeightA - hookWeightB;
            }
          }

          return a.time - b.time;
        }
      ),
      0,
      processedTestStep
    );
  };

  let timeMin: number = Infinity;
  let timeMax: number = -Infinity;

  mappedSteps.forEach((testStep, index) => {
    const testStepAnnotations = {
      end: testItemAnnotations.end.find(({ message }) => message.id === testStep.id),
      enqueue: testItemAnnotations.enqueue.find(({ message }) => message.id === testStep.id),
      start: testItemAnnotations.start.find(({ message }) => message.id === testStep.id),
    };

    let duration = testStep.duration || 1;
    let absoluteStartTime =
      testStepAnnotations.start?.time ??
      testItemRelativeStartTime + (testStep.relativeStartTime || 0);
    let absoluteEndTime = testStepAnnotations.end?.time ?? absoluteStartTime + duration;

    if (testStep.name === "assert") {
      // start failed asserts at their end time so they line up with the end
      // of the failed command but successful asserts with their start time
      if (testStep.error) {
        absoluteStartTime = absoluteEndTime - 1;
      } else {
        absoluteEndTime = absoluteStartTime + 1;
      }
      duration = 1;
    }

    let beginPoint = testStepAnnotations.start?.point ?? null;
    let beginTime = absoluteStartTime;
    let endPoint = testStepAnnotations.end?.point ?? null;
    let endTime = absoluteEndTime;

    if (testStep.name === "assert") {
      if (testStep.error) {
        beginPoint = endPoint;
        beginTime = endTime;
      } else {
        endPoint = beginPoint;
        endTime = beginTime;
      }
    }

    // This looks like an error, but it is an attempt to prevent a step from overlapping with the next tone.
    // In practice it seems the end time of one step often equals the start time of the next,
    // which can cause trouble when "stepping" and determining focus/selection.
    absoluteEndTime = Math.max(0, absoluteEndTime - 1);

    // These are used to filter network and navigation steps
    timeMin = Math.min(timeMin, absoluteStartTime);
    timeMax = Math.max(timeMax, absoluteEndTime);

    insertProcessedTestStep({
      data: {
        ...testStep,
        absoluteEndTime,
        absoluteStartTime,
        annotations: testStepAnnotations,
        duration,
        index,
      },
      metadata: {
        isFirst: index === 0,
        isLast: index === mappedSteps.length - 1,
        range: {
          beginPoint,
          beginTime,
          endPoint,
          endTime,
        },
      },
      time: absoluteStartTime,
      type: "step",
    });
  });

  const isDuringSteps = (time: number) => {
    return time >= timeMin && time < timeMax;
  };

  partialRequestsToCompleteSummaries(requestInfo, requestEventInfo, new Set()).forEach(
    requestSummary => {
      if (
        (requestSummary.cause === "xhr" || requestSummary.cause === "fetch") &&
        requestSummary.end != null &&
        isDuringSteps(requestSummary.end)
      ) {
        insertProcessedTestStep({
          data: requestSummary,
          type: "network",
          time: requestSummary.end,
        });
      }
    }
  );

  testItemAnnotations.navigationEvents.forEach(navigationEvent => {
    if (isDuringSteps(navigationEvent.time)) {
      insertProcessedTestStep({
        data: navigationEvent.message,
        time: navigationEvent.time,
        type: "navigation",
      });
    }
  });

  const sections: { [key: string]: { numSteps: number; testSteps: ProcessedTestStep[] } } = {
    afterAll: {
      numSteps: 0,
      testSteps: [],
    },
    afterEach: {
      numSteps: 0,
      testSteps: [],
    },
    beforeAll: {
      numSteps: 0,
      testSteps: [],
    },
    beforeEach: {
      numSteps: 0,
      testSteps: [],
    },
    testBody: {
      numSteps: 0,
      testSteps: [],
    },
  };

  let currentStack: ProcessedTestStep[] = sections.testBody.testSteps;
  let nonStepStack: ProcessedTestStep[] = [];

  for (let processedTestStep of processedTestSteps) {
    if (processedTestStep.type === "step") {
      let stackChanged = false;

      const hook = processedTestStep.data.hook;
      const currentSection = (hook && sections[hook]) ?? sections.testBody;

      // Refine to include test steps within the current section
      processedTestStep.data.index = currentSection.numSteps;

      currentSection.numSteps++;

      stackChanged = currentSection.testSteps !== currentStack;
      currentStack = currentSection.testSteps;

      if (!stackChanged) {
        currentStack.push(...nonStepStack.splice(0, nonStepStack.length));
      }

      currentStack.push(processedTestStep);
      currentStack.push(...nonStepStack.splice(0, nonStepStack.length));
    } else {
      if (currentStack.length !== 0) {
        nonStepStack.push(processedTestStep);
      }
    }
  }

  if (nonStepStack.length) {
    Object.values(sections).forEach(section => {
      if (section.testSteps.length) {
        section.testSteps.push(...nonStepStack);
      }
    });
  }

  return {
    afterAll: sections.afterAll.testSteps,
    afterEach: sections.afterEach.testSteps,
    beforeAll: sections.beforeAll.testSteps,
    beforeEach: sections.beforeEach.testSteps,
    testBody: sections.testBody.testSteps,
  };
}
