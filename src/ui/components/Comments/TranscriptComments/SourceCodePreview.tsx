import { ReactNode } from "react";

import { selectLocation } from "devtools/client/debugger/src/actions/sources";
import { getThreadContext } from "devtools/client/debugger/src/selectors";
import Icon from "replay-next/components/Icon";
import { SourceCodeComment } from "replay-next/components/sources/utils/comments";
import Tooltip from "replay-next/components/Tooltip";
import useTooltip from "replay-next/src/hooks/useTooltip";
import { getSourceFileNameFromUrl } from "replay-next/src/utils/source";
import { parsedTokensToHtml } from "replay-next/src/utils/syntax-parser";
import { setViewMode } from "ui/actions/layout";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { trackEvent } from "ui/utils/telemetry";

import styles from "./styles.module.css";

// Adapter component that can handle rendering legacy or modern source-code comments.
export default function SourceCodePreview({ comment }: { comment: SourceCodeComment }) {
  const { columnIndex, lineNumber, parsedTokens, plainText, sourceId, sourceUrl } =
    comment.typeData;

  const context = useAppSelector(getThreadContext);
  const dispatch = useAppDispatch();

  const onSelectSource = () => {
    dispatch(setViewMode("dev"));

    trackEvent("comments.select_location");

    dispatch(
      selectLocation(context, {
        column: columnIndex,
        line: lineNumber,
        sourceId,
        sourceUrl: sourceUrl || undefined,
      })
    );
  };

  let location: ReactNode | null = null;
  if (sourceUrl) {
    const fileName = getSourceFileNameFromUrl(sourceUrl);

    location = (
      <div>
        {fileName}:{lineNumber}
      </div>
    );
  }

  const { onMouseEnter, onMouseLeave, tooltip } = useTooltip({
    position: "above",
    tooltip: location,
    delay: 200,
  });

  let codePreview: ReactNode | null = null;
  if (parsedTokens) {
    const html = parsedTokensToHtml(parsedTokens);

    codePreview = (
      <pre
        className={styles.SecondaryLabel}
        dangerouslySetInnerHTML={{ __html: html || "&nbsp;" }}
      />
    );
  } else if (plainText) {
    codePreview = <pre className={styles.SecondaryLabel}>{plainText}</pre>;
  }

  return (
    <div className={styles.LabelGroup} onClick={onSelectSource}>
      <div className={styles.Labels} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
        {codePreview}
        <Tooltip>{tooltip}</Tooltip>
      </div>
      <Icon className={styles.Icon} type="chevron-right" />
    </div>
  );
}
