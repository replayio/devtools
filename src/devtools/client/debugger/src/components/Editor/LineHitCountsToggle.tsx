import React from "react";
import { useFeature } from "ui/hooks/settings";

import Toggle from "./Toggle";

function LineHitCountsToggle() {
  const { value } = useFeature("hitCounts");

  if (!value) {
    return null;
  }

  return (
    <label className="flex items-center space-x-1 pt-0.5 pl-3">
      <Toggle enabled={true} setEnabled={() => {}} />
      <span>Show Line Counts</span>
    </label>
  );
}

export default LineHitCountsToggle;
