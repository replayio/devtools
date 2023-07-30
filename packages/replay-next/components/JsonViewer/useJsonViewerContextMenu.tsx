import { ContextMenuItem, useContextMenu } from "use-context-menu";

import Icon from "replay-next/components/Icon";
import { copyToClipboard } from "replay-next/components/sources/utils/clipboard";

export function useJsonViewerContextMenu(jsonText: string) {
  const copyJson = () => {
    copyToClipboard(jsonText);
  };

  return useContextMenu(
    <>
      <ContextMenuItem onSelect={copyJson}>
        <>
          <Icon type="copy" />
          Copy JSON
        </>
      </ContextMenuItem>
    </>
  );
}
