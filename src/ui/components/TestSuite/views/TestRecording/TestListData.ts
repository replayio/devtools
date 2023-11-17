import { GenericListData } from "replay-next/components/windowing/GenericListData";
import {
  GroupedTestCases,
  TestEvent,
  TestSectionName,
} from "shared/test-suites/RecordingTestMetadata";

import {
  Metadata,
  TestEventItem,
  TestEventWithSectionName,
  TestSectionEntry,
  TestSectionEntryWithEvents,
} from "./types";

type TestListItemEntry = TestEventWithSectionName | TestSectionEntry;

export class TestListData extends GenericListData<TestEventItem> {
  private _testListItems: TestListItemEntry[];

  constructor(testSections: TestSectionEntryWithEvents[]) {
    super();

    this._testListItems = testSections
      .map(testSection => {
        if (testSection.events.length === 0) {
          return null;
        }
        const { name, title } = testSection;
        return [
          { name, title },
          ...testSection.events.map(event => ({
            testSectionName: name,
            event,
          })),
        ];
      })
      .filter(Boolean)
      .flat();
  }

  protected getItemCountImplementation(): number {
    return this._testListItems.length;
  }

  getItemAtIndexImplementation(index: number): TestEventItem {
    if (index < 0 || index >= this.getItemCount()) {
      throw new Error("Invalid index");
    }

    const testItem = this._testListItems[index];
    return {
      depth: 0,
      item: testItem,
      id: "event" in testItem ? testItem.event.id : testItem.name,
      isExpanded: false,
      isTail: false,
    };
  }
}
