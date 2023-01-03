import { closeTab, closeTabs } from "devtools/client/debugger/src/actions/tabs";
import {
  copyToClipboard as copySourceToClipboard,
  ensureSourcesIsVisible,
  showSource,
} from "devtools/client/debugger/src/actions/ui";
import { Tab, getContext, getTabs } from "devtools/client/debugger/src/selectors";
import { getRawSourceURL } from "devtools/client/debugger/src/utils/source";
import ContextMenuDivider from "replay-next/components/context-menu/ContextMenuDivider";
import ContextMenuItem from "replay-next/components/context-menu/ContextMenuItem";
import useContextMenu from "replay-next/components/context-menu/useContextMenu";
import { copyToClipboard as copyTextToClipboard } from "replay-next/components/sources/utils/clipboard";
import { MiniSource, getSelectedSource } from "ui/reducers/sources";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

export default function useTabContextMenu({ source }: { source: MiniSource }) {
  const dispatch = useAppDispatch();

  const cx = useAppSelector(getContext);
  const selectedSource = useAppSelector(getSelectedSource);
  const tabs = useAppSelector(getTabs);

  const sourceId = source.id;
  const isActive = selectedSource && sourceId == selectedSource.id;

  const onCloseAllTabsClick = () => {
    const sourceUrls = tabs.map((tab: Tab) => tab.url);

    dispatch(closeTabs(cx, sourceUrls));
  };

  const onCloseOtherTabsClick = () => {
    const otherTabs = tabs.filter((tab: Tab) => tab.sourceId !== source.id);
    const sourceUrls = otherTabs.map((tab: Tab) => tab.url);

    dispatch(closeTabs(cx, sourceUrls));
  };

  const onCloseTabClick = () => {
    dispatch(closeTab(cx, source));
  };

  const onCopyToClipboardClick = () => {
    if (selectedSource) {
      dispatch(copySourceToClipboard(selectedSource));
    }
  };

  const onCopySourceUriClick = () => {
    const rawUrl = getRawSourceURL(source.url);
    if (rawUrl) {
      copyTextToClipboard(rawUrl);
    }
  };

  const onRevealInTreeClick = () => {
    dispatch(ensureSourcesIsVisible());
    dispatch(showSource(cx, source.id));
  };

  return useContextMenu(
    <>
      <ContextMenuItem onClick={onCloseTabClick}>Close tab</ContextMenuItem>
      <ContextMenuItem disabled={tabs.length === 1} onClick={onCloseOtherTabsClick}>
        Close other tabs
      </ContextMenuItem>
      <ContextMenuItem onClick={onCloseAllTabsClick}>Close all tabs</ContextMenuItem>
      <ContextMenuDivider />
      <ContextMenuItem disabled={!isActive} onClick={onRevealInTreeClick}>
        Reveal in tree
      </ContextMenuItem>
      <ContextMenuItem disabled={!isActive} onClick={onCopyToClipboardClick}>
        Copy to clipboard
      </ContextMenuItem>
      <ContextMenuItem disabled={!isActive} onClick={onCopySourceUriClick}>
        Copy source URI
      </ContextMenuItem>
    </>
  );
}
