import { useMemo } from "react";

import useLocalStorage from "replay-next/src/hooks/useLocalStorage";

type Filter = "current-user" | null;
type SortBy = "created-at" | "recording-time";

export default function useUserCommentPreferences() {
  const [filter, setFilter] = useLocalStorage<Filter>("Replay:CommentPreferences:Filter", null);
  const [hideUnfocused, setHideUnfocused] = useLocalStorage<boolean>(
    "Replay:CommentPreferences:HideUnfocused",
    false
  );
  const [sortBy, setSortBy] = useLocalStorage<SortBy>(
    "Replay:CommentPreferences:sortBy",
    "recording-time"
  );

  return useMemo(
    () => ({
      filter,
      hideUnfocused,
      setFilter,
      setHideUnfocused,
      setSortBy,
      sortBy,
    }),
    [filter, hideUnfocused, setFilter, setHideUnfocused, setSortBy, sortBy]
  );
}
