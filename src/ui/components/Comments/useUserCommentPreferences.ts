import { useCallback } from "react";

import useLocalStorage from "replay-next/src/hooks/useLocalStorage";

type Filter = "current-user" | null;
type SortBy = "created-at" | "recording-time";

export type UserCommentPreferences = {
  filter: Filter;
  sortBy: SortBy;
};

export default function useUserCommentPreferences(): UserCommentPreferences & {
  setFilter(value: Filter): void;
  setSortBy(value: SortBy): void;
} {
  const [value, setValue] = useLocalStorage<UserCommentPreferences>("Replay:CommentPreferences", {
    filter: null,
    sortBy: "recording-time",
  });

  const setFilter = useCallback(
    (newFilter: Filter) => {
      setValue({ ...value, filter: newFilter });
    },
    [setValue, value]
  );

  const setSortBy = useCallback(
    (newSortBy: SortBy) => {
      setValue({ ...value, sortBy: newSortBy });
    },
    [setValue, value]
  );

  return {
    ...value,
    setFilter,
    setSortBy,
  };
}
