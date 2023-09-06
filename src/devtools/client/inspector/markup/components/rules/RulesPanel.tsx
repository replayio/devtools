import { useContext, useState } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { useImperativeCacheValue } from "suspense";

import { getPauseId } from "devtools/client/debugger/src/selectors";
import { RulesList } from "devtools/client/inspector/markup/components/rules/RulesList";
import { getSelectedNodeId } from "devtools/client/inspector/markup/selectors/markup";
import Icon from "replay-next/components/Icon";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { shallowEqual } from "shared/utils/compare";
import { useAppSelector } from "ui/setup/hooks";
import { processedNodeDataCache } from "ui/suspense/nodeCaches";
import { RuleState } from "ui/suspense/styleCaches";
import { cssRulesCache } from "ui/suspense/styleCaches";

import styles from "./RulesPanel.module.css";

const NO_RULES_AVAILABLE: RuleState[] = [];

export function RulesPanel() {
  const replayClient = useContext(ReplayClientContext);
  const { pauseId, selectedNodeId } = useAppSelector(
    state => ({
      pauseId: getPauseId(state),
      selectedNodeId: getSelectedNodeId(state),
    }),
    shallowEqual
  );

  const { value: node, status: nodeStatus } = useImperativeCacheValue(
    processedNodeDataCache,
    replayClient,
    pauseId!,
    selectedNodeId!
  );

  const canHaveRules = nodeStatus === "resolved" ? node?.isElement : false;

  // TODO [FE-1862] Use deferred value and Suspend for a better transition between rows
  const { value: cachedStyles, status } = useImperativeCacheValue(
    cssRulesCache,
    replayClient,
    canHaveRules ? pauseId : undefined,
    canHaveRules ? selectedNodeId : undefined
  );

  let rules = NO_RULES_AVAILABLE;
  if (status === "resolved" && cachedStyles) {
    rules = cachedStyles.rules;
  }

  const [searchText, setSearchText] = useState("");

  return (
    <div className={styles.RulesPanel} data-test-id="RulesPanel">
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
              noContentFallback={<div className={styles.NoStyles}>No styles to display</div>}
              rules={rules}
              searchText={searchText}
            />
          )}
        </AutoSizer>
      </div>
    </div>
  );
}
