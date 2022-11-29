import DefaultTypeAheadItemRenderer from "./DefaultTypeAheadItemRenderer";
import { ItemListRendererProps } from "./types";

export default function DefaultTypeAheadItemListRenderer<Item>({
  items,
  popupRef,
  selectedItem,
  selectItem,
}: ItemListRendererProps<Item>) {
  return (
    <div className="type-ahead-popup" ref={popupRef}>
      {items.map((item, index) => (
        <DefaultTypeAheadItemRenderer
          key={index}
          isSelected={selectedItem === items[index]}
          item={item as Item}
          selectItem={selectItem}
        />
      ))}
    </div>
  );
}
