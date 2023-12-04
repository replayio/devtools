import assert from "assert";

import { GenericListData } from "replay-next/components/windowing/GenericListData";
import { StoreWithInternals } from "ui/components/SecondaryToolbox/react-devtools/ReplayWall";
import { ReactElement } from "ui/components/SecondaryToolbox/react-devtools/types";

export class ReactDevToolsListData extends GenericListData<ReactElement> {
  private collapsedFiberIds: Set<number> = new Set();
  private defaultSelectedElementId: number | null = null;
  private store: StoreWithInternals;

  constructor(store: StoreWithInternals) {
    super();

    this.collapsedFiberIds = new Set();
    this.store = store;
  }

  getItemById(id: number): ReactElement | null {
    return this.store.getElementByID(id) as ReactElement | null;
  }

  processMutatedStore() {
    // Restore collapse state then selected element state
    this.collapsedFiberIds.forEach(id => {
      if (this.store.containsElement(id)) {
        this.store.toggleIsCollapsed(id, true);
      } else {
        this.collapsedFiberIds.delete(id);
      }
    });

    let selectedElement = null;

    const selectedIndex = this.getSelectedIndex();
    if (selectedIndex != null) {
      selectedElement = this.getItemAtIndex(selectedIndex);
    }

    this.invalidate();

    const defaultSelectedElementId = this.defaultSelectedElementId;
    if (defaultSelectedElementId !== null) {
      const element = this.getItemById(defaultSelectedElementId);
      this.selectElement(element);
    } else if (selectedElement) {
      this.selectElement(selectedElement);
    } else if (this.getItemCount() > 0) {
      this.setSelectedIndex(0);
    }
  }

  setDefaultSelectedElementId(defaultSelectedElementId: number | null) {
    this.defaultSelectedElementId = defaultSelectedElementId;

    if (defaultSelectedElementId !== null) {
      const element = this.getItemById(defaultSelectedElementId);
      if (element) {
        this.selectElement(element);
      }
    }
  }

  selectElement(element: ReactElement | null) {
    if (element) {
      const index = this.getIndexForItem(element);
      if (index >= 0) {
        this.setSelectedIndex(index);
        return;
      }
    }

    this.setSelectedIndex(null);
  }

  toggleCollapsed(element: ReactElement) {
    const isCollapsed = !element.isCollapsed;

    if (isCollapsed) {
      this.collapsedFiberIds.add(element.id);
    } else {
      this.collapsedFiberIds.delete(element.id);
    }

    this.store.toggleIsCollapsed(element.id, isCollapsed);
    this.invalidate();
  }

  protected getIndexForItemImplementation(element: ReactElement): number {
    const index = this.store.getIndexOfElementID(element.id);
    return index ?? -1;
  }

  protected getItemAtIndexImplementation(index: number): ReactElement {
    const id = this.store.getElementIDAtIndex(index);
    assert(id != null);
    const element = this.store.getElementByID(id);
    assert(element != null);
    return element as any as ReactElement;
  }

  protected getItemCountImplementation(): number {
    return this.store.numElements;
  }
}
