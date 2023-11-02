import { ReactDevToolsListData } from "ui/components/SecondaryToolbox/react-devtools/ReactDevToolsListData";

export function searchComponents(listData: ReactDevToolsListData, query: string): number[] {
  const matchingRows: number[] = [];

  query = query.toLowerCase();

  for (let index = 0; index < listData.getItemCount(); index++) {
    const item = listData.getItemAtIndex(index);
    if (
      item.displayName?.toLowerCase()?.includes(query) ||
      (item.key && `${item.key}`.toLowerCase().includes(query))
    ) {
      matchingRows.push(index);
    }
  }

  return matchingRows;
}
