import { useAppDispatch } from "packages/markerikson-stack-client-prototype/src/app/hooks";
import React, { useState } from "react";
import { seekToTime } from "ui/actions/timeline";

import { getSelectedStep } from "ui/reducers/reporter";
import { getCurrentTime } from "ui/reducers/timeline";
import { useAppSelector } from "ui/setup/hooks";

export function CypressToggler() {
  const currentTime = useAppSelector(getCurrentTime);
  const dispatch = useAppDispatch();
  const selectedStep = useAppSelector(getSelectedStep);

  if (!selectedStep || selectedStep.startTime === selectedStep.endTime ) {
    return null;
  }

  const onBefore = () => {
    dispatch(seekToTime(selectedStep.startTime));
  }
  const onAfter = () => {
    dispatch(seekToTime(selectedStep.endTime));
  }

  return (
    <div className="absolute flex h-full w-full items-end justify-center pb-4">
      <div className="flex rounded-md bg-themeToggleBgcolor p-1">
        <Button onClick={onBefore} active={currentTime === selectedStep.startTime}>
          Before
        </Button>
        <Button onClick={onAfter} active={currentTime === selectedStep.endTime}>
          After
        </Button>
      </div>
    </div>
  );
}

function Button({
  children,
  active,
  onClick,
}: {
  children: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button className={`rounded-md px-2 py-1 ${active ? "font-bold" : ""}`} onClick={onClick}>
      {children}
    </button>
  );
}
