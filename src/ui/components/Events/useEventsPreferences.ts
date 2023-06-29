import { useMemo } from "react";

import { usePreference } from "shared/preferences/usePreference";

export default function useEventsPreferences() {
  const [filters, setFilters] = usePreference("consoleEventFilters");

  return useMemo(
    () => ({
      filters,
      setFilters,
    }),
    [filters, setFilters]
  );
}
