import { useState } from "react";

import LineHitCounts from "./LineHitCounts";
import ToggleWidgetButton from "./ToggleWidgetButton";

export default function Gutter({ editor }: any) {
  const [isLineHitCountsCollapsed, setIsLineHitCountsCollapsed] = useState(false);
  return (
    <>
      <ToggleWidgetButton editor={editor} isLineHitCountsCollapsed={isLineHitCountsCollapsed} />
      <LineHitCounts
        editor={editor}
        isCollapsed={isLineHitCountsCollapsed}
        setIsCollapsed={setIsLineHitCountsCollapsed}
      />
    </>
  );
}
