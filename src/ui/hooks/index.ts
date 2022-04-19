import * as collaboratorsHooks from "./collaborators";
import { commentsHooks } from "./comments";
import * as recordingHooks from "./recordings";
import * as sessionHooks from "./sessions";
import * as settingsHooks from "./settings";
import * as usersHooks from "./users";
import * as workspacesHooks from "./workspaces";
import * as workspaceMembersHooks from "./workspaces_user";

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
