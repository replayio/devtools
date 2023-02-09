import classNames from "classnames";
import { useEffect, useRef, useState } from "react";

import { getSelectedPanel, getToolboxLayout } from "ui/reducers/layout";
import { getSelectedLocation } from "ui/reducers/sources";
import { useAppSelector } from "ui/setup/hooks";

export default function TabSpotlight() {
  const [isShown, setIsShown] = useState(false);
  const selectedSource = useAppSelector(getSelectedLocation);
  const layout = useAppSelector(getToolboxLayout);
  const selectedPanel = useAppSelector(getSelectedPanel);
  const timeoutKey = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!selectedSource?.sourceId || layout === "ide" || selectedPanel === "debugger") {
      return;
    }

    if (timeoutKey.current) {
      clearTimeout(timeoutKey.current);
    }

    setIsShown(true);

    timeoutKey.current = setTimeout(() => {
      setIsShown(false);
      timeoutKey.current = null;
    }, 2000);
    // eslint-disable-next-line react-hooks/exhaustive-deps

    return () => {
      clearTimeout(timeoutKey.current);
    };
  }, [selectedSource?.sourceId]);

  return (
    <span
      className={classNames("transition", isShown ? "text-primaryAccent" : "text-bodyColor")}
      style={{ transitionDuration: "3000" }}
    >
      Sources
    </span>
  );
}
