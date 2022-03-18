import { useState } from "react";
import { Comment } from "ui/state/comments";

type UseCommentsHookReturnType = {
  comments: Comment[];
  create: (content: Comment["content"], parentId: Comment["id"]) => void;
  update: (content: Comment["content"], commentId: Comment["id"]) => void;
  delete: (commentId: Comment["id"]) => void;
};

export const useComments = (): UseCommentsHookReturnType => {
  const [comments, setComments] = useState<Comment[]>([]);

  const createComment: UseCommentsHookReturnType["create"] = () => {};
  const updateComment: UseCommentsHookReturnType["update"] = () => {};
  const deleteComment: UseCommentsHookReturnType["delete"] = () => {};

  return {
    comments,
    create: createComment,
    update: updateComment,
    delete: deleteComment,
  };
};
