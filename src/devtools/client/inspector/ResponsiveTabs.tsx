import cx from "classnames";
import React, { CSSProperties, ReactElement, ReactNode, useEffect, useRef, useState } from "react";

type ResponsiveTabsProps = {
  className?: string;
  dropdownButton?: ReactNode;
  dropdownClassName?: string;
  dropdownStyle?: CSSProperties;
  children: ReactElement | ReactElement[];
  activeIdx: number;
};

export const ResponsiveTabs = ({
  className = "",
  dropdownButton,
  dropdownClassName,
  dropdownStyle,
  children,
  activeIdx,
}: ResponsiveTabsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLSpanElement[]>([]);
  const dropdownRef = useRef<HTMLSpanElement>(null);

  const tabs = Array.isArray(children) ? children : [children];

  const [visibleItemsCount, setVisibleItemsCount] = useState(tabs.length);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const ro = new ResizeObserver(() => {
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

      // let tabIndices = Array.from({ length: tabsRef.current.length }).map((_, idx) => idx);
      // tabIndices = [activeIdx, ...tabIndices.splice(activeIdx, 1)];

      for (let idx = 0; idx < tabs.length; idx++) {
        const tab = tabsRef.current[idx];
        _runningWidth += tab.clientWidth;
        if (_runningWidth > containerWidth) {
          setVisibleItemsCount(idx);
          return;
        }
      }
      setVisibleItemsCount(tabsRef.current.length);
    });

    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleClick = (e: any) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);

  return (
    <div className="relative max-w-full">
      <div className={cx("flex overflow-hidden", className)} ref={containerRef}>
        {tabs.map((tab, idx) => (
          <span
            key={tab.key}
            ref={ref => (tabsRef.current[idx] = ref!)}
            style={{
              pointerEvents: idx === 0 || idx < visibleItemsCount ? "auto" : "none",
              opacity: idx === 0 || idx < visibleItemsCount ? 1 : 0,
            }}
          >
            {tab}
          </span>
        ))}
      </div>
      {tabsRef.current.length !== visibleItemsCount && (
        <span
          onClick={() => setDropdownOpen(!dropdownOpen)}
          ref={dropdownRef}
          className={cx("absolute right-0 top-0 h-full flex items-center", dropdownClassName)}
        >
          {dropdownButton ?? (
            <span className="h-full select-none cursor-pointer px-1 flex items-center hover:bg-[color:var(--theme-tab-background)]">
              ···
            </span>
          )}
          {dropdownOpen && (
            <div
              className="absolute right-0 top-full responsive-tabs-dropdown"
              style={dropdownStyle}
            >
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
