import { commentsHooks } from "./comments";
import * as sessionHooks from "./sessions";
import * as recordingHooks from "./recordings";
import * as settingsHooks from "./settings";
import * as collaboratorsHooks from "./collaborators";
import * as workspacesHooks from "./workspaces";
import * as workspaceMembersHooks from "./workspaces_user";
import * as usersHooks from "./users";

export default {
  ...commentsHooks,
  ...sessionHooks,
  ...recordingHooks,
  ...settingsHooks,
  ...collaboratorsHooks,
  ...workspacesHooks,
  ...workspaceMembersHooks,
  ...usersHooks,
};
