import * as commentsHooks from "./comments";
import * as sessionHooks from "./sessions";
import * as recordingHooks from "./recordings";
import * as settingsHooks from "./settings";
import * as collaboratorsHooks from "./collaborators";
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
};
