import { ReactNode, useContext, useState } from "react";

import Icon from "replay-next/components/Icon";
import {
  isNetworkRequestCommentTypeData,
  isSourceCodeCommentTypeData,
  isVisualCommentTypeData,
} from "replay-next/components/sources/utils/comments";
import { SourcesContext } from "replay-next/src/contexts/SourcesContext";
import { getSourceFileNameFromUrl } from "replay-next/src/utils/source";
import { ParsedToken, parsedTokensToHtml } from "replay-next/src/utils/syntax-parser";

import styles from "./CommentPreview.module.css";

export default function CommentPreview({
  type,
  typeData,
}: {
  type: string | null;
  typeData: any | null;
}) {
  if (isNetworkRequestCommentTypeData(type, typeData)) {
    return (
      <NetworkRequestPreview
        id={typeData.id}
        method={typeData.method}
        name={typeData.name}
        time={typeData.time}
      />
    );
  } else if (isSourceCodeCommentTypeData(type, typeData)) {
    return (
      <SourceCodePreview
        columnIndex={typeData.columnIndex}
        lineNumber={typeData.lineNumber}
        parsedTokens={typeData.parsedTokens}
        rawText={typeData.plainText}
        sourceId={typeData.sourceId}
        sourceUrl={typeData.sourceUrl}
      />
    );
  } else if (isVisualCommentTypeData(type, typeData)) {
    return (
      <VisualPreview
        encodedImage={typeData.encodedImage}
        pageX={typeData.pageX}
        pageY={typeData.pageY}
        scaledX={typeData.scaledX}
        scaledY={typeData.scaledY}
      />
    );
  }

  return null;
}

function NetworkRequestPreview({
  id,
  method,
  name,
  time,
}: {
  id: string;
  method: string;
  name: string;
  time: number;
}) {
  return (
    <div className={styles.LabelGroup}>
      <div className={styles.Labels}>
        <div className={styles.NetworkRequestLabel}>
          <span className={styles.NetworkRequestMethod}>{`[${method}]`}</span> {name}
        </div>
      </div>
      <Icon className={styles.Icon} type="chevron-right" />
    </div>
  );
}

function SourceCodePreview({
  columnIndex,
  lineNumber,
  parsedTokens,
  rawText,
  sourceId,
  sourceUrl,
}: {
  columnIndex: number;
  lineNumber: number;
  parsedTokens: ParsedToken[] | null;
  rawText: string | null;
  sourceId: string;
  sourceUrl: string | null;
}) {
  const { openSource } = useContext(SourcesContext);

  let location: ReactNode | null = null;
  if (sourceUrl) {
    const fileName = getSourceFileNameFromUrl(sourceUrl);

    location = (
      <div className={styles.PrimaryLabel}>
        ${fileName}:{lineNumber}
      </div>
    );
  }

  let codePreview: ReactNode | null = null;
  if (parsedTokens) {
    const html = parsedTokensToHtml(parsedTokens);

    codePreview = (
      <pre
        className={styles.SecondaryLabel}
        dangerouslySetInnerHTML={{ __html: html || "&nbsp;" }}
      />
    );
  } else if (rawText) {
    codePreview = <pre className={styles.SecondaryLabel}>{rawText}</pre>;
  }

  const onClick = () => {
    const lineIndex = lineNumber - 1;

    openSource("view-source", sourceId, lineIndex, lineIndex);
  };

  return (
    <div className={styles.LabelGroup} onClick={onClick}>
      <div className={styles.Labels}>
        {location}
        {codePreview}
      </div>
      <Icon className={styles.Icon} type="chevron-right" />
    </div>
  );
}

function VisualPreview({
  encodedImage,
  pageX,
  pageY,
  scaledX,
  scaledY,
}: {
  encodedImage: string | null;
  pageX: number | null;
  pageY: number | null;
  scaledX: number | null;
  scaledY: number | null;
}) {
  const [showPreview, setShowPreview] = useState(false);

  if (encodedImage === null) {
    return null;
  }

  const onClick = () => setShowPreview(!showPreview);

  return (
    <div
      className={styles.OuterImageContainer}
      data-test-name="CommentPreview-TogglePreviewButton"
      data-test-preview-state={showPreview ? "visible" : "hidden"}
      onClick={onClick}
      title={showPreview ? "Hide preview" : "Show preview"}
    >
      {showPreview ? (
        <div className={styles.InnerImageContainer}>
          <img className={styles.Image} src={encodedImage} />

          {scaledX !== null && scaledY !== null && (
            <div
              className={styles.MarkerWrapper}
              style={{ left: `${scaledX * 100}%`, top: `${scaledY * 100}%` }}
            >
              <Icon className={styles.MarkerIcon} type="comment" />
            </div>
          )}
        </div>
      ) : (
        <div className={styles.ShowPreviewPrompt}>
          <Icon className={styles.PreviewIcon} type="preview" />
          Show preview
        </div>
      )}
    </div>
  );
}
