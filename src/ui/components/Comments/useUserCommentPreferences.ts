import { useMemo } from "react";

import { useGraphQLUserData } from "shared/user-data/GraphQL/useGraphQLUserData";

export default function useUserCommentPreferences() {
  const [filter, setFilter] = useGraphQLUserData("comments_filterBy");
  const [showPreview, setShowPreview] = useGraphQLUserData("comments_showPreview");
  const [sortBy, setSortBy] = useGraphQLUserData("comments_sortBy");

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
