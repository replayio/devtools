export type Position = "after" | "before";

import { TestEvent, TestSectionName } from "shared/test-suites/RecordingTestMetadata";

export interface TestSectionEntry {
  name: TestSectionName;
  title: string;
}

export interface TestSectionEntryWithEvents extends TestSectionEntry {
  events: TestEvent[];
}

export interface TestEventWithSectionName {
  testSectionName: TestSectionName;
  event: TestEvent;
}

export const isTestSectionEntry = (
  item: TestEventWithSectionName | TestSectionEntry
): item is TestSectionEntry => {
  return "name" in item && "title" in item;
};

export type TestEventItem = {
  depth: number;
  item: TestEventWithSectionName | TestSectionEntry;
  id: string;
  isExpanded: boolean;
  isTail: boolean;
};

export type Metadata = {
  childrenCanBeRendered: boolean;
  depth: number;
  event: Event;
  hasTail: boolean;
  isExpanded: boolean;

  subTreeWeight: number;
};
