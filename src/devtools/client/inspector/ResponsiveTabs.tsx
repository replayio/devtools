import cx from "classnames";
import React, { FC, useEffect, useRef, useState } from "react";

type ResponsiveTabsProps = {
  selected: string;
  options: {
    label: string;
    value: string;
  }[];
  onChange?: (value: string) => void;
  className?: string;
  tabClassName?: string;
  dropdownButtonClassName?: string;
  dropdownClassName?: string;
};

export const ResponsiveTabs: FC<ResponsiveTabsProps> = ({
  selected,
  options,
  onChange,
  className = "",
  dropdownButtonClassName = "",
  dropdownClassName = "",
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
    <div ref={containerRef} className={`flex relative ${className}`}>
      {options.map(({ label, value }, idx) => (
        <span
          onClick={() => {
            onChange?.(value);
          }}
          key={value}
          ref={ref => (tabsRef.current[idx] = ref!)}
          style={{
            pointerEvents: idx < visibleItemsCount ? "auto" : "none",
            opacity: idx < visibleItemsCount ? 1 : 0,
          }}
          className={cx(tabClassName, { selected: value === selected })}
        >
          {label}
        </span>
      ))}
      {tabsRef.current.length !== visibleItemsCount && (
        <span
          onClick={() => setDropdownOpen(!dropdownOpen)}
          ref={dropdownRef}
          className={`absolute right-0 top-0 h-full ${dropdownButtonClassName}`}
        >
          ↓
          <div
            className={cx(
              "absolute right-0 top-full",
              dropdownClassName,
              dropdownOpen ? "block" : "none"
            )}
          >
            {options.slice(visibleItemsCount).map(({ label, value }) => (
              <div
                key={value}
                onClick={() => {
                  onChange?.(value);
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
