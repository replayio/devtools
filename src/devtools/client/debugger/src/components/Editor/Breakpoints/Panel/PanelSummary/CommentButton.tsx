import React from "react";
import classNames from "classnames";

import { isDemo } from "ui/utils/environment";

interface CommentButtonProps {
  addComment: (e: React.MouseEvent) => void;
  pausedOnHit: boolean;
}

export default function CommentButton({ addComment, pausedOnHit }: CommentButtonProps) {
  {
    if (isDemo()) {
      return null;
    }

    return (
      <button
        type="button"
        onClick={addComment}
        title="Add Comment"
        className={classNames(
          pausedOnHit ? "paused-add-comment" : "bg-primaryAccent hover:bg-primaryAccentHover",
          "inline-flex items-center rounded-md border border-transparent px-1 text-xs font-medium leading-4 text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primaryAccent focus:ring-offset-2"
        )}
      >
        <div className="material-icons add-comment-icon text-base text-white">add_comment</div>
      </button>
    );
  }
}
