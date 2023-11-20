import { assert } from "protocol/utils";
import { GenericListData } from "replay-next/components/windowing/GenericListData";
import {
  GroupedTestCases,
  TestEvent,
  TestSectionName,
  isFunctionTestEvent,
} from "shared/test-suites/RecordingTestMetadata";

import {
  Metadata,
  TestEventWithSectionName,
  TestListDisplayItem,
  TestListItem,
  TestSectionEntry,
  TestSectionEntryWithEvents,
  isTestEventWithName,
  isTestSectionEntry,
} from "./types";

const testEventToEventEntry = (
  testEvent: TestEvent,
  testSectionName: TestSectionName
): TestEventWithSectionName => {
  return {
    id: testEvent.id,
    testSectionName,
    event: testEvent,
  };
};

function getItemWeight(metadata: Metadata): number {
  // Note that it's important to use subTreeWeight
  // because childNode may contained nodes that aren't displayed
  const { isExpanded, subTreeWeight, hasChildren } = metadata;

  if (hasChildren) {
    if (isExpanded) {
      return subTreeWeight + 1;
    } else {
      return 1;
    }
  } else {
    return 1;
  }
}

export class TestListData extends GenericListData<TestListDisplayItem> {
  private _testListItems: TestListItem[];
  private _idToMutableMetadataMap: Map<string, Metadata> = new Map();
  private _idToTestListItemEntryMap: Map<string, TestListItem> = new Map();
  private _rootIds: Set<string> = new Set();

  constructor(testSections: TestSectionEntryWithEvents[]) {
    super();

    this._testListItems = testSections
      .map(testSection => {
        if (testSection.events.length === 0) {
          return null;
        }
        const { name, title } = testSection;
        return [
          { id: name, name, title },
          ...testSection.events.map(testEvent => testEventToEventEntry(testEvent, name)),
        ];
      })
      .filter(Boolean)
      .flat();

    for (const item of this._testListItems) {
      this._rootIds.add(item.id);
      this._idToTestListItemEntryMap.set(item.id, item);
    }

    this._addNestedTestEvents(null, this._testListItems, 0);

    this._calculateSubTreeWeights();
  }

  private _addNestedTestEvents(
    parentId: string | null,
    testListItems: TestListItem[],
    depth: number
  ) {
    let parentMetadata: Metadata | undefined;
    if (parentId !== null) {
      this._idToMutableMetadataMap.get(parentId);
    }

    for (const testListItem of testListItems) {
      const id = testListItem.id;
      const metadata: Metadata = {
        id,
        parentId,
        childrenCanBeRendered: true,
        hasChildren: false,
        depth,
        item: testListItem,
        isExpanded: false,
        subTreeWeight: 0,
      };

      this._idToMutableMetadataMap.set(id, metadata);

      if (isTestEventWithName(testListItem) && isFunctionTestEvent(testListItem.event)) {
        const childEvents = testListItem.event.data.events;
        if (childEvents.length > 0) {
          metadata.hasChildren = true;

          const testItemEntries = childEvents.map(childEvent =>
            testEventToEventEntry(childEvent, testListItem.testSectionName)
          );
          for (const testItemEntry of testItemEntries) {
            this._idToTestListItemEntryMap.set(testItemEntry.id, testItemEntry);
          }

          this._addNestedTestEvents(id, testItemEntries, depth + 1);
        }
      }
    }
  }

  private _calculateSubTreeWeights() {
    const leafNodes = [...this._idToMutableMetadataMap.values()].filter(
      metadata => !metadata.hasChildren
    );

    for (const leafNode of leafNodes) {
      let parentId: string | null = leafNode.parentId;
      while (parentId) {
        const parentMetadata = this._idToMutableMetadataMap.get(parentId);
        assert(parentMetadata);
        parentMetadata.subTreeWeight += 1;
        parentId = parentMetadata.parentId;
      }
    }
  }

  protected getItemCountImplementation(): number {
    return this._testListItems.length;
  }

  getItemAtIndexImplementation(index: number): TestListDisplayItem {
    if (index < 0 || index >= this.getItemCount()) {
      throw new Error("Invalid index");
    }

    const testItem = this._testListItems[index];
    return {
      id: testItem.id,
      // TODO Fill in parentId
      parentId: null,
      depth: 0,
      item: testItem,
      isExpanded: false,
    };
  }
}
