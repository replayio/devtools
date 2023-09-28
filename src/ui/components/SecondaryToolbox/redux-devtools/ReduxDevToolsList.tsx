import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List } from "react-window";

import { ReduxActionAnnotation } from "ui/components/SecondaryToolbox/redux-devtools/annotations";
import {
  ITEM_SIZE,
  ItemData,
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
      children={({ height }) => {
        const list = (
          <List<ItemData>
            height={height}
            itemData={{
              annotations,
              firstAnnotationAfterCurrentExecutionPoint,
              selectedAnnotation,
              selectAnnotation,
            }}
            width="100%"
            itemCount={annotations.length}
            itemSize={ITEM_SIZE}
          >
            {ReduxDevToolsListItem}
          </List>
        );

        return list;
      }}
    />
  );
}
