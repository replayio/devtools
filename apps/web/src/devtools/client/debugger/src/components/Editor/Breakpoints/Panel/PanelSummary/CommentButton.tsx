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
          "inline-flex items-center px-1 border border-transparent text-xs leading-4 font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent"
        )}
      >
        <div className="material-icons text-base text-white add-comment-icon">add_comment</div>
      </button>
    );
  }
}
