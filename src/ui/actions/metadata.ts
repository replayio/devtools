import { ThreadFront } from "protocol/thread";
import { Action } from "redux";
import { selectors } from "ui/reducers";
import { UIStore, UIThunkAction } from ".";
import { Comment } from "ui/state/metadata";
const { prefs, features } = require("ui/utils/prefs");
import { User } from "ui/state/metadata";
import { query } from "ui/utils/apolloClient";
import { gql } from "@apollo/client";

const LogRocket = require("ui/utils/logrocket").default;

export type SetCommentsAction = Action<"set_comments"> & { comments: Comment[] };
export type SetFocusedCommentAction = Action<"set_focused_comment_id"> & { id: number | null };
export type RegisterUserAction = Action<"register_user"> & { user: User };
export type UpdateUsersAction = Action<"update_users"> & { users: User[] };
export type MetadataAction = SetFocusedCommentAction | RegisterUserAction | UpdateUsersAction;

// Metadata key used to store comments.
const CommentsMetadata = "devtools-comments";
const UsersMetadata = "devtools-users";
let heartbeatPing = Date.now();
const refreshRate = 10000;

export function setupMetadata(_: any, store: UIStore) {
  ThreadFront.watchMetadata(UsersMetadata, args => store.dispatch(onUsersUpdate(args)));

  if (features.users) {
    store.dispatch(registerUser());
    setInterval(() => store.dispatch(userHeartbeat()), 5000);
  }
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

async function fetchUserId(authId: string) {
  const response = await query({
    query: gql`
      query GetUserId($authId: String) {
        users(where: { auth_id: { _eq: $authId } }) {
          id
        }
      }
    `,
    variables: { authId },
  });

  return response.data?.users[0].id;
}

export function updateUser(authUser: any = {}): UIThunkAction {
  return async ({ dispatch, getState }) => {
    const user = selectors.getUser(getState());
    const userId = await fetchUserId(authUser.sub);

    // NOTE: the user coming from redux is likely a guest account with a
    // simple id and avatar ID for the color
    dispatch({
      type: "register_user",
      user: {
        id: userId || user.id,
        avatarID: user.avatarID,
        picture: authUser.picture,
        name: authUser.name,
        loggedIn: !!userId,
      },
    });

    if (authUser.sub) {
      LogRocket.identify(authUser.sub, {
        name: authUser.name,
        email: authUser.email,
        id: userId,
      });
    }
  };
}
