import { JSONContent } from "@tiptap/react";
import { sortBy } from "lodash";
import { Comment } from "ui/state/comments";

export const flatToHierarchicalComments = (comments: Comment[]): Comment[] => {
  const topLevelComments: Comment[] = [];

  for (const comment of comments) {
    if (!comment.parentId) {
      topLevelComments.push(comment);
    } else {
      const parentComment = comments.find(c => c.id === comment.parentId);
      if (parentComment) {
        parentComment.replies.push(comment);
      }
    }
  }

  return topLevelComments;
};

export const sortHierarchicalComments = (comments: Comment[]): Comment[] => {
  const sortReplies = (comment: Comment) => {
    const sortedReplies = sortBy(comment.replies, ["time", "createdAt"]);
    for (const reply of sortedReplies) {
      sortReplies(reply);
    }
  };

  const root = {
    replies: comments,
  } as Comment;
  sortReplies(root);

  return root.replies;
};

export const tryToParse = (content: string): JSONContent => {
  try {
    return JSON.parse(content);
  } catch {
    // Our comments were not always JSON, they used to be stored as markdown
    // In that case, we just render the raw markdown.
    const textContent = content ? [{ type: "text", text: content }] : [];
    return {
      type: "doc",
      content: [{ type: "paragraph", content: textContent }],
    };
  }
};
