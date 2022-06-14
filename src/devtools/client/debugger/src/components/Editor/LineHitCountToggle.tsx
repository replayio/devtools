import { useFeature } from "ui/hooks/settings";

import Toggle from "./Toggle";

export default function LineHitCountToggle() {
  const { value, update } = useFeature("inlineHitCounts");

  return (
    <div className="mapped-source flex items-center space-x-1 pt-0.5 pl-3">
      <Toggle enabled={value} setEnabled={update} />
      <div>Show Hit Counts</div>
    </div>
  );
}
