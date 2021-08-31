import React, { useEffect, useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import { createLabels } from "ui/actions/comments";

type PropsFromParent = {
  comment: any;
};
type CommentSourceProps = PropsFromRedux & PropsFromParent;

function CommentSource({ comment, createLabels }: CommentSourceProps) {
  const [labels, setLabels] = useState<{ primary: string | null; secondary: string | null }>({
    primary: comment.primaryLabel,
    secondary: comment.secondaryLabel,
  });

  useEffect(() => {
    async function updateLabels() {
      setLabels(await createLabels(comment.sourceLocation!));
    }
    if (comment.sourceLocation && !labels.primary && !labels.secondary) {
      updateLabels();
    }
  }, []);

  return (
    <div className="space-y-5 p-3 rounded-xl rounded-b-none border-b border-gray-200">
      <div className="font-medium flex flex-col">
        <div className="font-semibold">{labels.primary}</div>
        <div
          className="cm-s-mozilla font-mono overflow-hidden whitespace-pre text-xs"
          dangerouslySetInnerHTML={{ __html: labels.secondary || "" }}
        />
      </div>
    </div>
  );
}

const connector = connect(null, { createLabels });
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(CommentSource);
