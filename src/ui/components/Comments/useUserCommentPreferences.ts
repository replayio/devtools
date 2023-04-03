import { useMemo } from "react";

import useLocalStorage from "replay-next/src/hooks/useLocalStorage";

type Filter = "current-user" | null;
type SortBy = "created-at" | "recording-time";

export default function useUserCommentPreferences() {
  const [filter, setFilter] = useLocalStorage<Filter>("Replay:CommentPreferences:Filter", null);
  const [showPreview, setShowPreview] = useLocalStorage<boolean>(
    "Replay:CommentPreferences:ShowPreview",
    true
  );
  const [sortBy, setSortBy] = useLocalStorage<SortBy>(
    "Replay:CommentPreferences:sortBy",
    "recording-time"
  );

  return useMemo(
    () => ({
      filter,
      setFilter,
      setShowPreview,
      setSortBy,
      showPreview,
      sortBy,
    }),
    [filter, setFilter, setShowPreview, setSortBy, showPreview, sortBy]
  );
}
