import cx from "classnames";
import React, {
  CSSProperties,
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

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
  const [indicesOrder, setIndicesOrder] = useState<number[]>(
    Array.from({ length: tabs.length }).map((_, idx) => idx)
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const recalcTabsVisibilityAndOrder = useCallback(() => {
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
      setIndicesOrder(Array.from({ length: tabs.length }).map((_, idx) => idx));
      return;
    }

    // we will need a dropdown for sure,
    // so let's calc which items are visible
    const dropdownButtonWidth = dropdownRef.current?.clientWidth ?? 0;
    const activeTabWidth = tabsRef.current[activeIdx].clientWidth ?? 0;

    let visibleCount = 1;
    let tabIndices: number[] = [activeIdx];

    let runningWidth = dropdownButtonWidth + activeTabWidth;
    for (let idx = 0; idx < tabs.length; idx++) {
      if (idx === activeIdx) {
        continue;
      }

      runningWidth += tabsRef.current[idx].clientWidth;

      if (runningWidth <= containerWidth) {
        if (idx < activeIdx) {
          tabIndices.pop();
          tabIndices = [...tabIndices, idx, activeIdx];
        } else {
          tabIndices.push(idx);
        }
        visibleCount++;
      } else {
        tabIndices.push(idx);
      }
    }

    setVisibleItemsCount(visibleCount);
    setIndicesOrder(tabIndices);
  }, [activeIdx, tabs.length]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const ro = new ResizeObserver(() => {
      recalcTabsVisibilityAndOrder();
    });

    ro.observe(containerRef.current);

    const container = containerRef.current;

    return () => {
      ro.unobserve(container);
    };
  }, [recalcTabsVisibilityAndOrder]);

  useEffect(() => {
    recalcTabsVisibilityAndOrder();
  }, [activeIdx, recalcTabsVisibilityAndOrder]);

  useEffect(() => {
    recalcTabsVisibilityAndOrder();
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

  const orderedTabs = indicesOrder.map(idx => tabs[idx]);
  const hasDropdown = visibleItemsCount < tabs.length;

  return (
    <div className="relative max-w-full">
      <div className={cx("flex overflow-hidden", className)} ref={containerRef}>
        {orderedTabs.map((tab, idx) => (
          <span
            key={tab.key}
            ref={ref => (tabsRef.current[indicesOrder[idx]] = ref!)}
            style={{
              pointerEvents: idx < visibleItemsCount ? "auto" : "none",
              opacity: idx < visibleItemsCount ? 1 : 0,
            }}
          >
            {tab}
          </span>
        ))}
      </div>
      {hasDropdown && (
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
              {orderedTabs.slice(visibleItemsCount).map(tab => (
                <div key={tab.key}>{tab}</div>
              ))}
            </div>
          )}
        </span>
      )}
    </div>
  );
};
