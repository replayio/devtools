import { Dispatch, ReactNode, SetStateAction, createContext, useMemo, useState } from "react";

import { Workspace } from "shared/graphql/types";

import { MY_LIBRARY_TEAM } from "../TeamContextRoot";

export type TimeFilterOptions = "hour" | "day" | "week" | "two-week" | "month";

type TimeFilterContextType = {
  filterByTime: TimeFilterOptions;
  startTime: Date;
  endTime: Date;
  setFilterByTime: Dispatch<SetStateAction<TimeFilterOptions>>;
};

export const TimeFilterContext = createContext<TimeFilterContextType>(null as any);

const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
};

const hoursAgo = (hours: number) => {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  date.setSeconds(0, 0);
  return date;
};

const filterOptionToTimeRange = (filterByTime: TimeFilterOptions) => {
  const currentTime = new Date();

  switch (filterByTime) {
    case "hour":
      return [hoursAgo(1), currentTime];
    case "day":
      return [daysAgo(1), currentTime];
    case "week":
      return [daysAgo(7), currentTime];
    case "two-week":
      return [daysAgo(14), currentTime];
    case "month":
      return [daysAgo(30), currentTime];
    default:
      return [daysAgo(7), currentTime];
  }
};

export function TimeFilterContextRoot({ children }: { children: ReactNode }) {
  const [filterByTime, setFilterByTime] = useState<TimeFilterOptions>("week");

  const [startTime, endTime] = useMemo(() => filterOptionToTimeRange(filterByTime), [filterByTime]);

  return (
    <TimeFilterContext.Provider value={{ filterByTime, startTime, endTime, setFilterByTime }}>
      {children}
    </TimeFilterContext.Provider>
  );
}

export function withinTeamRetentionLimit(
  team: Workspace | typeof MY_LIBRARY_TEAM | null | undefined,
  days: number
) {
  if (!team) {
    return false;
  }

  return team.retentionLimit == null || team.retentionLimit >= days;
}
