import { useMemo } from "react";

import useLocalStorage from "replay-next/src/hooks/useLocalStorage";

export type Filters = {
  keyboard: boolean;
  mouse: boolean;
  navigation: boolean;
};
export type FiltersKey = keyof Filters;

const DEFAULT_FILTERS: Filters = {
  keyboard: true,
  mouse: true,
  navigation: true,
};

export default function useEventsPreferences() {
  const [filters, setFilters] = useLocalStorage<Filters>(
    "Replay:EventsPreferences:Filters",
    DEFAULT_FILTERS
  );

  return useMemo(
    () => ({
      filters,
      setFilters,
    }),
    [filters, setFilters]
  );
}
