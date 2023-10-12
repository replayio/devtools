import { useCallback, useEffect, useRef } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List } from "react-window";

import { ReduxActionAnnotation } from "ui/components/SecondaryToolbox/redux-devtools/annotations";
import {
  ITEM_SIZE,
  ItemData,
  ItemDataWithScroll,
  ReduxDevToolsListItem,
} from "ui/components/SecondaryToolbox/redux-devtools/ReduxDevToolsListItem";

export function ReduxDevToolsList({
  annotations,
  firstAnnotationAfterCurrentExecutionPoint,
  selectedAnnotation,
  selectAnnotation,
}: {
  annotations: ReduxActionAnnotation[];
  firstAnnotationAfterCurrentExecutionPoint: ReduxActionAnnotation | null;
  selectedAnnotation: ReduxActionAnnotation | null;
  selectAnnotation: (annotation: ReduxActionAnnotation | null) => void;
}) {
  return (
    <AutoSizer
      disableWidth
      children={({ height }) => (
        <ReduxDevtoolsVirtualList
          annotations={annotations}
          firstAnnotationAfterCurrentExecutionPoint={firstAnnotationAfterCurrentExecutionPoint}
          selectedAnnotation={selectedAnnotation}
          selectAnnotation={selectAnnotation}
          height={height}
        />
      )}
    />
  );
}

function ReduxDevtoolsVirtualList({
  annotations,
  firstAnnotationAfterCurrentExecutionPoint,
  selectedAnnotation,
  selectAnnotation,
  height,
}: ItemData & { height: number }) {
  const listRef = useRef<List<ItemDataWithScroll>>(null);
  const scrollToPause = useCallback(() => {
    const listEl = listRef.current!;

    if (firstAnnotationAfterCurrentExecutionPoint) {
      const itemIndex = annotations.indexOf(firstAnnotationAfterCurrentExecutionPoint);
      listEl.scrollToItem(itemIndex);
    }
    // We have surpassed the last annotation, so there isn't any annotation after this
    // Instead we jump to the last annotation directly
    if (!firstAnnotationAfterCurrentExecutionPoint && annotations) {
      listEl.scrollToItem(annotations.length - 1);
    }
  }, [firstAnnotationAfterCurrentExecutionPoint, annotations]);

  useEffect(() => {
    scrollToPause();
  }, [scrollToPause]);

  return (
    <List<ItemDataWithScroll>
      ref={listRef}
      height={height}
      itemData={{
        annotations,
        firstAnnotationAfterCurrentExecutionPoint,
        selectedAnnotation,
        selectAnnotation,
        scrollToPause,
      }}
      width="100%"
      itemCount={annotations.length}
      itemSize={ITEM_SIZE}
    >
      {ReduxDevToolsListItem}
    </List>
  );
}
