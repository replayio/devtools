import React, { FC, useEffect, useRef, useState } from "react";

type ResponsiveTabsProps = {
  selected: string;
  options: {
    label: string;
    value: string;
  }[];
  onClick?: (value: string) => void;
  className?: string;
  tabClassName?: string;
  dropdownButtonClassName?: string;
  dropdownClassName?: string;
};
export const ResponsiveTabs: FC<ResponsiveTabsProps> = ({
  selected,
  options,
  onClick,
  className,
  dropdownButtonClassName,
  dropdownClassName,
  tabClassName = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLSpanElement[]>([]);
  const dropdownRef = useRef<HTMLSpanElement>(null);
  const [visibleItemsCount, setVisibleItemsCount] = useState(options.length);
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
    <div
      ref={containerRef}
      style={{
        display: "flex",
        border: "1px solid green",
        position: "relative",
      }}
      className={className}
    >
      {options.map(({ label, value }, idx) => (
        <span
          onClick={() => {
            onClick?.(value);
          }}
          key={value}
          ref={ref => (tabsRef.current[idx] = ref!)}
          style={{
            pointerEvents: idx < visibleItemsCount ? "auto" : "none",
            opacity: idx < visibleItemsCount ? 1 : 0,
          }}
          className={`${tabClassName} ${value === selected ? "selected" : ""}`}
        >
          {label}
        </span>
      ))}
      {tabsRef.current.length !== visibleItemsCount && (
        <span
          onClick={() => setDropdownOpen(!dropdownOpen)}
          ref={dropdownRef}
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            height: "100%",
          }}
          className={dropdownButtonClassName}
        >
          ↓
          <div
            style={{
              display: dropdownOpen ? "block" : "none",
              position: "absolute",
              right: 0,
              top: "100%",
            }}
            className={dropdownClassName}
          >
            {options.slice(visibleItemsCount).map(({ label, value }) => (
              <div
                key={value}
                onClick={() => {
                  onClick?.(value);
                }}
                className={`${tabClassName} ${value === selected ? "selected" : ""}`}
              >
                {label}
              </div>
            ))}
          </div>
        </span>
      )}
    </div>
  );
};
