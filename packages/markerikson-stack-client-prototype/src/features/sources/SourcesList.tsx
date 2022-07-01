import { useGetSourcesQuery } from "../../app/api";
import { useAppDispatch, useAppSelector } from "../../app/hooks";

import { sourceEntrySelected } from "./sourcesSlice";

export const SourcesList = () => {
  const dispatch = useAppDispatch();
  const selectedSourceId = useAppSelector(state => state.sources.selectedSourceId);

  const { data } = useGetSourcesQuery();

  return (
    <ul>
      {data?.src.map(entry => {
        const isSelected = selectedSourceId === entry.sourceId;
        let entryText: React.ReactNode = new URL(entry.url!).pathname;
        if (isSelected) {
          entryText = <span style={{ fontWeight: "bold" }}>{entryText}</span>;
        }

        const onLineClicked = () => dispatch(sourceEntrySelected(entry.sourceId));
        return (
          <li key={entry.sourceId} onClick={onLineClicked}>
            {entryText}
          </li>
        );
      })}
    </ul>
  );
};
