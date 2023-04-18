import { ExecutionPoint } from "@replayio/protocol";

import {
  AnnotatedTestStep as AnnotatedTestStepData,
  Annotation,
  CypressAnnotationMessage as NavigationTestStepData,
  TestItem,
  TestResult,
} from "shared/graphql/types";
import { RequestSummary as NetworkTestStepData } from "ui/components/NetworkMonitor/utils";

export type AnnotatedTestStep = {
  data: AnnotatedTestStepData;
  metadata: {
    isFirst: boolean;
    isLast: boolean;
    range: {
      beginPoint: ExecutionPoint | null;
      beginTime: number | null;
      endPoint: ExecutionPoint | null;
      endTime: number | null;
    };
  };
  time: number;
  type: "step";
};

export type NetworkTestStep = {
  data: NetworkTestStepData;
  time: number;
  type: "network";
};

export type NavigationTestStep = {
  data: NavigationTestStepData;
  time: number;
  type: "navigation";
};

export type ProcessedTestStep = AnnotatedTestStep | NetworkTestStep | NavigationTestStep;

// TestItem but with attached annotations, adjusted relativeStartTime, and making some attributes required.
export type ProcessedTestItem = Omit<TestItem, "path" | "relativeStartTime" | "steps"> & {
  annotations: ProcessedTestItemAnnotations;

  duration: number;

  // e.g. "cypress/integration/all/azure.spec.ts"
  filePath: string;

  // Annotation-based start time (more accurate than TestItem start time)
  relativeStartTime: number;

  // e.g. "chromium", "gecko"
  runtime: string;

  // The "scope" refers to the title of a describe() block.
  // A test file may not contain any of these,
  // or it may contain many of (and they can be nested)
  //
  // e.g. describe('foo') => describe('bar') => it('should baz') will have scope ["foo", "bar"]
  // e.g. a module level it() will have scope []
  scopePath: string[];

  // Original TestSteps, separated into before, test body, and after sections.
  // Original "steps" type are also interleaved with faux network and navigation "steps".
  sections: ProcessedTestItemSections;

  // Title of the it() block
  title: string;
};

export type ProcessedTestItemAnnotations = {
  end: Annotation[];
  enqueue: Annotation[];
  navigationEvents: Annotation[];
  start: Annotation[];
};

export type ProcessedTestItemSections = {
  afterAll: ProcessedTestStep[];
  afterEach: ProcessedTestStep[];
  beforeAll: ProcessedTestStep[];
  beforeEach: ProcessedTestStep[];
  testBody: ProcessedTestStep[];
};

export type ProcessedTestMetadata = {
  duration: number;
  hasMissingSteps: boolean;
  result: TestResult;
  resultCounts: ProcessedTestMetadataResultCounts;
  runner: { name: string; version: string; plugin: string } | null;
  title: string;
  version: number;
};

export type ProcessedTestMetadataResultCounts = {
  failed: number;
  passed: number;
  skipped: number;
};
