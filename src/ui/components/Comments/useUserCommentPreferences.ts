import { useMemo } from "react";

import { useGraphQLUserData } from "shared/user-data/GraphQL/useGraphQLUserData";

export default function useUserCommentPreferences() {
  const [filter, setFilter] = useGraphQLUserData("commentFilterBy");
  const [showPreview, setShowPreview] = useGraphQLUserData("commentShowPreview");
  const [sortBy, setSortBy] = useGraphQLUserData("commentSortBy");

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
