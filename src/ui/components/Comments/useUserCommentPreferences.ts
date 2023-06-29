import { useMemo } from "react";

import { usePreference } from "shared/preferences/usePreference";

export default function useUserCommentPreferences() {
  const [filter, setFilter] = usePreference("commentFilterBy");
  const [showPreview, setShowPreview] = usePreference("commentShowPreview");
  const [sortBy, setSortBy] = usePreference("commentSortBy");

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
