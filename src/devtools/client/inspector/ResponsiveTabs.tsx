import cx from "classnames";
import React, { ReactElement, ReactNode, useEffect, useRef, useState } from "react";

type ResponsiveTabsProps = {
  className?: string;
  dropdownButton?: ReactNode;
  children: ReactElement | ReactElement[];
};

export const ResponsiveTabs = ({
  className = "",
  dropdownButton,
  children,
}: ResponsiveTabsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLSpanElement[]>([]);
  const dropdownRef = useRef<HTMLSpanElement>(null);

  const tabs = (Array.isArray(children) ? children : [children]).map((child, idx) => {
    return React.cloneElement(child, { ref: tabsRef.current[idx] });
  });

  const [visibleItemsCount, setVisibleItemsCount] = useState(tabs.length);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const ro = useRef<ResizeObserver>(
    new ResizeObserver(() => {
      const containerWidth = containerRef.current?.clientWidth ?? 0;

      // we will always close dropdown when resizing
      setDropdownOpen(false);

      // check if maybe we don't need a dropdown at all
      let totalTabsWidth = 0;
      for (const tab of tabsRef.current) {
        totalTabsWidth += tab.clientWidth;
      }

      if (totalTabsWidth <= containerWidth) {
        setVisibleItemsCount(tabsRef.current.length);
        return;
      }

      // we will need a dropdown for sure,
      // so let's calc which items are visible
      let _runningWidth = dropdownRef.current?.clientWidth ?? 0;
      for (let idx = 0; idx < tabsRef.current.length; idx++) {
        const tabWidth = tabsRef.current[idx].clientWidth;
        _runningWidth += tabsRef.current[idx].clientWidth;
        if (_runningWidth > containerWidth) {
          setVisibleItemsCount(idx);
          return;
        }
      }
      setVisibleItemsCount(tabsRef.current.length);
    })
  );

  useEffect(() => {
    if (!containerRef.current || !ro.current) {
      return;
    }

    ro.current.observe(containerRef.current);

    const _ro = ro.current;
    return () => {
      _ro.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className={cx("flex items-center relative", className)}>
      {tabs.map((tab, idx) => (
        <span
          key={tab.key}
          ref={ref => (tabsRef.current[idx] = ref!)}
          style={{
            pointerEvents: idx < visibleItemsCount ? "auto" : "none",
            opacity: idx < visibleItemsCount ? 1 : 0,
          }}
        >
          {tab}
        </span>
      ))}
      {tabsRef.current.length !== visibleItemsCount && (
        <span
          onClick={() => setDropdownOpen(!dropdownOpen)}
          ref={dropdownRef}
          className="absolute right-0 top-0 h-full flex items-center"
        >
          {dropdownButton ?? <span className="cursor-pointer px-1">···</span>}
          {dropdownOpen && (
            <div className="absolute right-0 top-full z-20">
              {tabs.slice(visibleItemsCount).map(tab => (
                <div key={tab.key}>{tab}</div>
              ))}
            </div>
          )}
        </span>
      )}
    </div>
  );
};
