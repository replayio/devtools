import classNames from "classnames";
import { getSelectedLocation } from "devtools/client/debugger/src/reducers/sources";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { getSelectedPanel, getToolboxLayout } from "ui/reducers/layout";

export default function TabSpotlight() {
  const [isShown, setIsShown] = useState(false);
  const selectedSource = useSelector(getSelectedLocation);
  const layout = useSelector(getToolboxLayout);
  const selectedPanel = useSelector(getSelectedPanel);
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
  }, [selectedSource?.sourceId]);

  return (
    <div
      className={classNames(
        "h-full w-full bg-yellow-500 absolute top-0 left-0 transition-opacity duration-500",
        isShown ? "opacity-50" : "opacity-0"
      )}
    />
  );
}
