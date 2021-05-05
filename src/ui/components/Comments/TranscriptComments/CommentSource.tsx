import React, { useRef, useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";
import { UIState } from "ui/state";
const { getFilenameFromURL } = require("devtools/client/debugger/src/utils/sources-tree/getURL");
const { getTextAtLocation } = require("devtools/client/debugger/src/reducers/sources");
const { findClosestFunction } = require("devtools/client/debugger/src/utils/ast");
const { getSymbols } = require("devtools/client/debugger/src/reducers/ast");
const { getCodeMirror } = require("devtools/client/debugger/src/utils/editor/create-editor");

type PropsFromParent = {
  comment: any;
};
type CommentSourceProps = PropsFromRedux & PropsFromParent;

function CommentSource({ comment, closestFunction, snippet }: CommentSourceProps) {
  const { sourceUrl, line } = comment.sourceLocation;
  const filename = getFilenameFromURL(sourceUrl);
  const CodeMirror = getCodeMirror();
  const secondaryLabelNode = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (snippet && secondaryLabelNode.current && CodeMirror) {
      CodeMirror.runMode(snippet, "javascript", secondaryLabelNode.current);
    }
  }, [snippet]);

  return (
    <div className="space-y-6 p-4 rounded-xl rounded-b-none border-b border-gray-200">
      <div className="text-lg font-medium flex flex-col">
        <div className="font-semibold">{closestFunction?.name || `${filename}:${line}`}</div>
        <div
          className="cm-s-mozilla font-mono overflow-hidden whitespace-pre text-base"
          ref={secondaryLabelNode}
        >
          {snippet}
        </div>
      </div>
    </div>
  );
}

const connector = connect((state: UIState, { comment: { sourceLocation } }: PropsFromParent) => ({
  snippet: sourceLocation
    ? getTextAtLocation(state, sourceLocation.sourceId, sourceLocation) || ""
    : "",
  closestFunction: sourceLocation
    ? findClosestFunction(getSymbols(state, { id: sourceLocation?.sourceId }), sourceLocation)
    : null,
}));
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(CommentSource);
