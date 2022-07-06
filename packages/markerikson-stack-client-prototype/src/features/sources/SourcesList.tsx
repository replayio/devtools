import { useAppDispatch, useAppSelector, useAppStore } from "../../app/hooks";

import { sourceEntrySelected } from "./selectedSourcesSlice";
import { getSourceDetails } from "./sourcesCache";

export const SourcesList = () => {
  const dispatch = useAppDispatch();
  const selectedSourceId = useAppSelector(state => state.selectedSources.selectedSourceId);
  const store = useAppStore();

  const sourceDetails = getSourceDetails(store);

  return (
    <ul>
      {sourceDetails.map(entry => {
        const isSelected = selectedSourceId === entry.id;
        let entryText: React.ReactNode = "Unknown URL";

        if (entry.url) {
          entryText = new URL(entry.url!).pathname;
        }
        if (isSelected) {
          entryText = <span style={{ fontWeight: "bold" }}>{entryText}</span>;
        }

        const onLineClicked = () => dispatch(sourceEntrySelected(entry.id));
        return (
          <li key={entry.id} onClick={onLineClicked}>
            {entryText} ({entry.kind})
          </li>
        );
      })}
    </ul>
  );
};
