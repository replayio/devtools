import React from "react";
import classNames from "classnames";

interface CommentButtonProps {
  addComment: (e: React.MouseEvent) => void;
  pausedOnHit: boolean;
}

export default function CommentButton({ addComment, pausedOnHit }: CommentButtonProps) {
  {
    return (
      <button
        type="button"
        onClick={addComment}
        title="Add Comment"
        className={classNames(
          pausedOnHit ? "paused-add-comment" : "bg-primaryAccent hover:bg-primaryAccentHover",
          "inline-flex items-center rounded-md border border-transparent px-1 text-xs font-medium leading-4 text-buttontextColor shadow-sm focus:outline-none focus:ring-2 focus:ring-primaryAccent focus:ring-offset-2"
        )}
      >
        <div className="text-base material-icons add-comment-icon text-buttontextColor">add_comment</div>
      </button>
    );
  }
}
