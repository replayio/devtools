import React from "react";

import { setSelectedPanel, setViewMode } from "ui/actions/layout";
import { selectAndFetchRequest } from "ui/actions/network";
import { RequestSummary } from "ui/components/NetworkMonitor/utils";
import { useAppDispatch } from "ui/setup/hooks";
import { AnnotatedTestStep } from "ui/types";

import { XHR_TYPE } from "./TestSteps";

export function NetworkEvent({
  method,
  status,
  url,
  id,
}: {
  method: string;
  status?: number;
  url: string;
  id: string;
}) {
  const dispatch = useAppDispatch();
  const onClick = () => {
    dispatch(setViewMode("dev"));
    dispatch(setSelectedPanel("network"));
    dispatch(selectAndFetchRequest(id));
  };

  return (
    <button className="font-italic flex border-b border-themeBase-90 p-1 px-2" onClick={onClick}>
      {method} {status} {new URL(url).pathname}
    </button>
  );
}
export const getDisplayedEvents = (
  step: AnnotatedTestStep,
  steps: AnnotatedTestStep[],
  data: RequestSummary[],
  startTime: number
) => {
  return data.filter(r => {
    if (!r.end) {
      return false;
    }

    const isDuringStep = (time: number, start: number, end: number) => time >= start && time < end;
    const applicableSteps = steps.filter(s =>
      isDuringStep(
        r.end!,
        startTime + s.relativeStartTime,
        startTime + s.relativeStartTime + s.duration
      )
    );

    return (
      applicableSteps[applicableSteps.length - 1]?.id === step.id && r.documentType === XHR_TYPE
    );
  });
};
