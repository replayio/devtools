import { Dispatch, ReactNode, SetStateAction, createContext, useMemo, useState } from "react";

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
  // Make end time consistent
  if (days > 1) {
    date.setHours(0, 0, 0, 0);
  } else {
    date.setMinutes(0, 0, 0);
  }
  return date;
};

export function TimeFilterContextRoot({ children }: { children: ReactNode }) {
  const [filterByTime, setFilterByTime] = useState<TimeFilterOptions>("week");

  const [startTime, endTime] = useMemo(() => {
    const currentTime = new Date();

    switch (filterByTime) {
      case "hour":
        return [daysAgo(1 / 24), currentTime];
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
  }, [filterByTime]);

  return (
    <TimeFilterContext.Provider value={{ filterByTime, startTime, endTime, setFilterByTime }}>
      {children}
    </TimeFilterContext.Provider>
  );
}
