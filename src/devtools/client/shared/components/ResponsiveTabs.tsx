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

  const calcTabsVisibilityAndOrder = useCallback(() => {
    const containerWidth = containerRef.current?.clientWidth ?? 0;

    // we will always close dropdown when resizing
    setDropdownOpen(false);

    // check if maybe we don't need a dropdown at all
    let totalTabsWidth = 0;
    for (const tab of tabsRef.current) {
      totalTabsWidth += tab.clientWidth;
    }

    if (totalTabsWidth <= containerWidth) {
      setVisibleItemsCount(tabs.length);
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
          tabIndices.splice(tabIndices.length - 1, 0, idx);
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
    calcTabsVisibilityAndOrder();

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const ro = new ResizeObserver(calcTabsVisibilityAndOrder);
    ro.observe(container);

    return () => {
      ro.unobserve(container);
    };
  }, [calcTabsVisibilityAndOrder]);

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
          className={cx("absolute right-0 top-0 flex h-full items-center", dropdownClassName)}
        >
          {dropdownButton ?? (
            <span className="flex h-full cursor-pointer select-none items-center px-1 hover:bg-[color:var(--theme-tab-background)]">
              ···
            </span>
          )}
          {dropdownOpen && (
            <div
              className="responsive-tabs-dropdown absolute right-0 top-full"
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
