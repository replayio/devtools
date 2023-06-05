import { ReplayClientInterface } from "shared/client/types";
import { Annotation } from "shared/graphql/types";
import {
  GroupedTestCases,
  IncrementalGroupedTestCases,
  TestRecording,
  isGroupedTestCases,
  isIncrementalGroupedTestCases,
} from "shared/test-suites/types";
import { AnnotationsCache } from "ui/components/TestSuite/suspense/AnnotationsCache";

import { convertIncrementalTestRecordingToFullRecordedTest } from "./convertIncrementalTestRecordingToFullRecordedTest";

export async function convertIncrementalGroupedTestCasesToFullGroupedTestCases(
  groupedTestCases: IncrementalGroupedTestCases | GroupedTestCases,
  replayClient: ReplayClientInterface
): Promise<GroupedTestCases> {
  if (isIncrementalGroupedTestCases(groupedTestCases)) {
    const { testRecordings: partialTestRecordings, ...rest } = groupedTestCases;

    const annotations = await AnnotationsCache.readAsync();

    // Annotations for the entire recording (which may include more than one test)
    // we need to splice only the appropriate subset for each test.
    const annotationsByTest: Annotation[][] = annotations.reduce(
      (accumulated: Annotation[][], annotation: Annotation) => {
        if (annotation.message.event === "test:start") {
          accumulated.push([annotation]);
        } else {
          accumulated[accumulated.length - 1].push(annotation);
        }

        return accumulated;
      },
      []
    );

    // IncrementalGroupedTestCases and GroupedTestCases types are the same,
    // except for annotation data inside of their recorded tests
    let testRecordings: TestRecording[] = [];
    for (let index = 0; index < partialTestRecordings.length; index++) {
      const legacyTest = partialTestRecordings[index];
      const annotations = annotationsByTest[index];

      const test = await convertIncrementalTestRecordingToFullRecordedTest(
        legacyTest,
        annotations,
        replayClient
      );

      testRecordings.push(test);
    }

    return {
      ...rest,
      testRecordings: testRecordings,
    };
  } else if (isGroupedTestCases(groupedTestCases)) {
    return groupedTestCases;
  } else {
    // This function does not support the legacy TestMetadata format
    throw Error(`Unsupported legacy TestMetadata value`);
  }
}
