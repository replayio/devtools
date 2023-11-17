import { CSSProperties, Dispatch, Fragment, ReactNode, SetStateAction } from "react";

import { GenericListItemData } from "replay-next/components/windowing/GenericList";
import {
  TestEvent,
  TestRunnerName,
  TestSectionName,
} from "shared/test-suites/RecordingTestMetadata";

import { TestSectionRow } from "./TestSectionRow";
import { TestEventItem, TestSectionEntry, isTestSectionEntry } from "./types";
import testSectionStyles from "./TestSection.module.css";

export const ITEM_SIZE = 32;

export type TestListItemData = {
  testRunnerName: TestRunnerName | null;
};

export function TestListItem({
  data,
  index,
  style,
}: {
  data: GenericListItemData<TestEventItem, TestListItemData>;
  index: number;
  style: CSSProperties;
}) {
  const { itemData, listData } = data;
  const { testRunnerName } = itemData;

  const selectedIndex = listData.getSelectedIndex();
  const listItem = listData.getItemAtIndex(index);
  const { depth, item, id, isExpanded, isTail } = listItem;

  let content: React.ReactNode = null;

  if (isTestSectionEntry(item)) {
    content = <TestSectionHeaderRenderer testSectionEntry={item} />;
  } else {
    const { event, testSectionName } = item;
    content = (
      <TestSectionRow
        testEvent={event}
        testRunnerName={testRunnerName}
        testSectionName={testSectionName}
      />
    );
  }

  return (
    <>
      <div
        data-list-index={index}
        data-selected={index === selectedIndex || undefined}
        data-test-name="ElementsListItem"
        style={
          {
            ...style,
            width: undefined,
            "--data-depth": depth != null ? `${depth}rem` : undefined,
          } as CSSProperties
        }
      >
        {content}
      </div>
    </>
  );
}

export function TestSectionHeaderRenderer({
  testSectionEntry,
}: {
  testSectionEntry: TestSectionEntry;
}) {
  return (
    <div className={testSectionStyles.Title} data-test-name="TestSection">
      {testSectionEntry.title}
    </div>
  );
}
