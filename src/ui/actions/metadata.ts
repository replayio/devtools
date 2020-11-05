import { ThreadFront } from "protocol/thread";
import { Action } from "redux";
import { selectors } from "ui/reducers";
import { UIStore, UIThunkAction } from ".";
import { Comment } from "ui/state/metadata";
import { prefs, features } from "ui/utils/prefs";
import { seek } from "./timeline";
import { User } from "ui/state/metadata";
import LogRocket from "ui/utils/logrocket";

export type SetCommentsAction = Action<"set_comments"> & { comments: Comment[] };
export type SetFocusedCommentAction = Action<"set_focused_comment_id"> & { id: number | null };
export type RegisterUserAction = Action<"register_user"> & { user: User };
export type UpdateUsersAction = Action<"update_users"> & { users: User[] };
export type MetadataAction =
  | SetCommentsAction
  | SetFocusedCommentAction
  | RegisterUserAction
  | UpdateUsersAction;

// Metadata key used to store comments.
const CommentsMetadata = "devtools-comments";
const UsersMetadata = "devtools-users";
let heartbeatPing = Date.now();
const refreshRate = 10000;

export function setupMetadata(_: any, store: UIStore) {
  ThreadFront.watchMetadata(CommentsMetadata, args => store.dispatch(onCommentsUpdate(args)));
  ThreadFront.watchMetadata(UsersMetadata, args => store.dispatch(onUsersUpdate(args)));

  if (features.users) {
    store.dispatch(registerUser());
    setInterval(() => store.dispatch(userHeartbeat()), 5000);
  }
}

function onCommentsUpdate(newComments: Comment[]): UIThunkAction {
  return ({ dispatch }) => {
    dispatch({ type: "set_comments", comments: newComments || [] });
  };
}

export function createComment(newComment: Comment): UIThunkAction {
  return ({ getState, dispatch }) => {
    const existingComments = selectors.getComments(getState());
    const currentTime = selectors.getCurrentTime(getState());
    const user = selectors.getUser(getState());

    if (existingComments.some(comment => comment.time === currentTime)) {
      return;
    }

    const comment = newComment || {
      id: (Math.random() * 1e9) | 0,
      sessionId: ThreadFront.sessionId,
      point: ThreadFront.currentPoint,
      hasFrames: ThreadFront.currentPointHasFrames,
      time: currentTime,
      contents: "",
      user: user,
    };

    const newComments = [...existingComments, comment];

    ThreadFront.updateMetadata(CommentsMetadata, () => newComments);

    dispatch({
      type: "set_comments",
      comments: newComments,
    });
    dispatch({
      type: "set_focused_comment_id",
      id: comment.id,
    });
  };
}

export function jumpToComment(comment: Comment): UIThunkAction {
  return ({ dispatch }) => {
    dispatch(seek(comment.point, comment.time, comment.hasFrames));
  };
}

export function removeComment(comment: Comment): UIThunkAction {
  return ({ getState, dispatch }) => {
    const comments = selectors.getComments(getState());
    const newComments = comments.filter(c => c.id != comment.id);
    dispatch(updateComments(newComments));
  };
}

export function updateComment(comment: Comment): UIThunkAction {
  return ({ dispatch, getState }) => {
    const existingComments = selectors.getComments(getState());

    const commentIndex = existingComments.findIndex(c => c.id === comment.id);
    const newComments = [...existingComments];
    newComments.splice(commentIndex, 1, comment);
    dispatch(updateComments(newComments));
  };
}

export function saveComment(
  newContents: string,
  location: string,
  oldComment: Comment
): UIThunkAction {
  return ({ dispatch, getState }) => {
    const comments = selectors.getComments(getState());

    // Only update the comment's contents if the user is trying to save a
    // non-empty string. Otherwise, delete the comment.
    if (newContents === "") {
      const newComments = comments.filter(c => c.id != oldComment.id);
      dispatch(updateComments(newComments));
    } else {
      const commentIndex = comments.findIndex(c => c.id === oldComment.id);
      const newComment = { ...oldComment, contents: newContents };
      const newComments = [...comments];

      newComments.splice(commentIndex, 1, newComment);
      dispatch(updateComments(newComments));
    }

    if (location === "timeline") {
      dispatch({ type: "set_focused_comment_id", id: null });
    }
  };
}

export function updateComments(comments: Comment[]): UIThunkAction {
  return ({ dispatch }) => {
    ThreadFront.updateMetadata(CommentsMetadata, () => comments);
    dispatch({ type: "set_comments", comments });
  };
}

export function focusComment(comment: Comment): UIThunkAction {
  return ({ dispatch, getState }) => {
    const { id, time, point, hasFrames } = comment;
    dispatch({ type: "set_focused_comment_id", id });
    dispatch(seek(point, time, hasFrames));
  };
}

export function unfocusComment(comment: Comment): UIThunkAction {
  return ({ dispatch, getState }) => {
    // Unlike the timeline, the selecting a comment on the right sidebar doesn't
    // focus on that comment. Instead, we pass in the comment that is being edited
    const focusedComment = selectors.getFocusedComment(getState()) || comment;

    // We should remove empty comments (e.g. newly created comments)
    if (focusedComment.contents === "") {
      const comments = selectors.getComments(getState());
      const newComments = comments.filter(c => c.id != focusedComment.id);

      dispatch(updateComments(newComments));
    }

    dispatch({ type: "set_focused_comment_id", id: null });
  };
}

function setFocusedCommentId(id: number): SetFocusedCommentAction {
  return { type: "set_focused_comment_id", id };
}

export function registerUser(): RegisterUserAction {
  const user = prefs.user?.id
    ? prefs.user
    : {
        id: `${Math.ceil(Math.random() * 10e4)}`,
        avatarID: Math.ceil(Math.random() * 10),
      };

  return { type: "register_user", user };
}

function userHeartbeat(): UIThunkAction {
  return ({ getState }) => {
    const me = selectors.getUser(getState());
    ThreadFront.updateMetadata(UsersMetadata, (users = []) => {
      const newUsers = [...users].filter(
        user => user.id !== me.id && user.heartbeat - heartbeatPing < refreshRate
      );

      if (me.id) {
        newUsers.push({ ...me, heartbeat: Date.now() });
      }

      return newUsers;
    });

    heartbeatPing = Date.now();
  };
}

function onUsersUpdate(users: User[]): UIThunkAction {
  return ({ dispatch }) => {
    // ThreadFront.updateMetadata(UsersMetadata, () => comments);
    dispatch({ type: "update_users", users });
  };
}

export function getActiveUsers(): UIThunkAction {
  return ({ getState }) => {
    const users = selectors.getUsers(getState());
    if (!users) {
      return [];
    }

    const activeUsers = users.filter(user => heartbeatPing - (user.heartbeat || 0) < refreshRate);

    return activeUsers;
  };
}

export function updateUser(authUser: any = {}): UIThunkAction {
  return async ({ dispatch, getState }) => {
    const user = selectors.getUser(getState());
    const { picture, name } = authUser;
    const { id, avatarID } = user;
    const updatedUser = { id, avatarID, picture, name };

    dispatch({ type: "register_user", user: updatedUser });

    if (authUser.sub) {
      LogRocket.identify(authUser.sub, {
        name: authUser.name,
        email: authUser.email,
      });
    }
  };
}
