import classNames from "classnames";
import { getSelectedLocation } from "ui/reducers/sources";
import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "ui/setup/hooks";
import { getSelectedPanel, getToolboxLayout } from "ui/reducers/layout";

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
