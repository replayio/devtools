import { useContext, useDeferredValue, useState } from "react";
import AutoSizer from "react-virtualized-auto-sizer";

import { RulesList } from "devtools/client/inspector/markup/components/rules/RulesList";
import { getSelectedNodeId } from "devtools/client/inspector/markup/selectors/markup";
import { elementCache } from "replay-next/components/elements-old/suspense/ElementCache";
import Icon from "replay-next/components/Icon";
import { useMostRecentLoadedPause } from "replay-next/src/hooks/useMostRecentLoadedPause";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { shallowEqual } from "shared/utils/compare";
import { useAppSelector } from "ui/setup/hooks";
import { isElement } from "ui/suspense/nodeCaches";
import { RuleState, cssRulesCache } from "ui/suspense/styleCaches";

import styles from "./RulesPanel.module.css";

const NO_RULES_AVAILABLE: RuleState[] = [];

export function RulesPanelSuspends() {
  const replayClient = useContext(ReplayClientContext);
  const { pauseId } = useMostRecentLoadedPause() ?? {};
  const { selectedNodeId } = useAppSelector(
    state => ({
      selectedNodeId: getSelectedNodeId(state),
    }),
    shallowEqual
  );

  const deferredPauseId = useDeferredValue(pauseId);
  const deferredSelectedNodeId = useDeferredValue(selectedNodeId);

  const isPending = pauseId !== deferredPauseId || selectedNodeId !== deferredSelectedNodeId;

  const element =
    deferredPauseId && deferredSelectedNodeId
      ? elementCache.read(replayClient, deferredPauseId, deferredSelectedNodeId)
      : null;

  const canHaveRules = element && isElement(element.node);

  const cachedStyles = cssRulesCache.read(
    replayClient,
    canHaveRules ? deferredPauseId : undefined,
    canHaveRules ? deferredSelectedNodeId : undefined
  );

  const [searchText, setSearchText] = useState("");

  return (
    <div
      className={styles.RulesPanel}
      data-test-id="RulesPanel"
      data-is-pending={isPending || undefined}
    >
      <div className={styles.FilterRow}>
        <Icon className={styles.FilterIcon} type="filter" />
        <input
          className={styles.FilterInput}
          onChange={({ target }) => setSearchText(target.value)}
          placeholder="Find Styles"
          value={searchText}
        />
      </div>
      <div className={styles.ListWrapper}>
        <AutoSizer disableWidth>
          {({ height }: { height: number }) => (
            <RulesList
              height={height}
              noContentFallback={
                <div className={styles.NoStyles}>
                  {selectedNodeId ? "No styles to display" : "No element selected"}
                </div>
              }
              rules={cachedStyles?.rules ?? NO_RULES_AVAILABLE}
              searchText={searchText}
            />
          )}
        </AutoSizer>
      </div>
    </div>
  );
}
