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

function getChildNodeIds(testListItem: TestListItem) {
  if (isTestEventWithName(testListItem) && isFunctionTestEvent(testListItem.event)) {
    return testListItem.event.data.events.map(event => event.id);
  }

  return [];
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
        hasChildren: false,
        depth,
        item: testListItem,
        isExpanded: true,
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

  private getMutableMetadata(id: string): Metadata {
    const metadata = this._idToMutableMetadataMap.get(id);
    assert(metadata, `Could not find metadata for ${id}`);
    return metadata;
  }

  protected getItemCountImplementation(): number {
    // return this._testListItems.length;
    return this._idToTestListItemEntryMap.size;
  }

  getItemAtIndexImplementation(index: number): TestListDisplayItem {
    if (index < 0 || index >= this.getItemCount()) {
      throw new Error("Invalid index");
    }

    assert(this._rootIds.size > 0, "Root ids should be populated");

    let currentNodeIds = [...this._rootIds];
    let currentNodeId: string | undefined = undefined;
    let currentIndex = 0;

    while (currentNodeIds.length > 0 && currentIndex <= index) {
      for (let nodeIndex = 0; nodeIndex < currentNodeIds.length; nodeIndex++) {
        currentNodeId = currentNodeIds[nodeIndex]!;
        const metadata = this.getMutableMetadata(currentNodeId);

        const weight = getItemWeight(metadata);

        if (currentIndex + weight > index) {
          // The element we're looking for is either this node itself or within its subtree
          // Break out of the for loop and start looking into the current child next

          const item: TestListDisplayItem = {
            id: currentNodeId,
            parentId: metadata.parentId,
            depth: metadata.depth,
            item: metadata.item,
            isExpanded: metadata.isExpanded,
          };

          if (currentIndex === index) {
            return item;
          } else {
            currentNodeIds = getChildNodeIds(metadata.item);
            currentIndex++;
            break;
          }
        } else {
          // Skip over the current node and keep looking
          currentIndex += weight;
        }
      }
    }

    throw Error(`Could not find node at index ${index}`);

    // const testItem = this._testListItems[index];
    // return {
    //   id: testItem.id,
    //   // TODO Fill in parentId
    //   parentId: null,
    //   depth: 0,
    //   item: testItem,
    //   isExpanded: false,
    // };
  }
}
