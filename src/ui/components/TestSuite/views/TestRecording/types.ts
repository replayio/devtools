export type Position = "after" | "before";

import { TestEvent, TestSectionName } from "shared/test-suites/RecordingTestMetadata";

export type TestListItem = TestEventWithSectionName | TestSectionEntry;

export interface TestSectionEntry {
  id: string;
  name: TestSectionName;
  title: string;
}

export interface TestSectionEntryWithEvents extends TestSectionEntry {
  events: TestEvent[];
}

export interface TestEventWithSectionName {
  id: string;
  testSectionName: TestSectionName;
  event: TestEvent;
}

export const isTestSectionEntry = (item: TestListItem): item is TestSectionEntry => {
  return "name" in item && "title" in item;
};

export const isTestEventWithName = (item: TestListItem): item is TestEventWithSectionName => {
  return "event" in item;
};

export type TestListDisplayItem = {
  id: string;
  parentId: string | null;
  depth: number;
  item: TestListItem;
  isExpanded: boolean;
};

export type Metadata = {
  id: string;
  parentId: string | null;
  hasChildren: boolean;
  // childrenCanBeRendered: boolean;
  depth: number;
  item: TestListItem;
  isExpanded: boolean;
  subTreeWeight: number;
};
