import { isReplayBrowser } from "shared/utils/environment";
import { Nag } from "ui/hooks/users";

import { shouldShowNag } from "./tour";

function queryParams() {
  return new URL(window.location.href).searchParams;
}

// We use this to show a custom login message for when new users are sent
// to the login screen through a link they got from an email notification
// i.e. Replay User invites Non-User to a team via their email, Non-User
// opens that link and is shown a customized login screen
export const isTeamMemberInvite = () => queryParams().get("teaminvite");

// This is for the user onboarding flow where the user opens the Replay
// browser for the first time. It teaches them how to create their first replay.
export function firstReplay(nags: Nag[]): boolean {
  return shouldShowNag(nags, Nag.FIRST_REPLAY_2) && isReplayBrowser();
}

// This is for the user onboarding flow where the user first opens the replay app
// and it's not in the Replay browser. This will prompt them to download Replay.
export function downloadReplay(nags: Nag[], dismissNag: (nag: Nag) => void): boolean {
  if (isReplayBrowser()) {
    dismissNag(Nag.DOWNLOAD_REPLAY);

    return false;
  }

  return shouldShowNag(nags, Nag.DOWNLOAD_REPLAY);
}

export function shouldShowConsoleNavigate(nags: Nag[]): boolean {
  return shouldShowNag(nags, Nag.FIRST_CONSOLE_NAVIGATE);
}

export function shouldShowBreakpointAdd(nags: Nag[]): boolean {
  return shouldShowNag(nags, Nag.FIRST_BREAKPOINT_ADD);
}

export function shouldShowBreakpointEdit(nags: Nag[]): boolean {
  return shouldShowNag(nags, Nag.FIRST_BREAKPOINT_EDIT);
}

export function shouldShowAddComment(nags: Nag[]): boolean {
  return shouldShowNag(nags, Nag.ADD_COMMENT);
}

export function shouldShowAddCommentToLine(nags: Nag[]): boolean {
  return shouldShowNag(nags, Nag.ADD_COMMENT_TO_LINE);
}

export function shouldShowAddCommentToNetworkRequest(nags: Nag[]): boolean {
  return shouldShowNag(nags, Nag.ADD_COMMENT_TO_NETWORK_REQUEST);
}

export function shouldShowAddCommentToPrintStatement(nags: Nag[]): boolean {
  return shouldShowNag(nags, Nag.ADD_COMMENT_TO_PRINT_STATEMENT);
}

export function shouldShowJumpToCode(nags: Nag[]): boolean {
  return shouldShowNag(nags, Nag.JUMP_TO_CODE);
}

export function shouldShowAddUnicornBadge(nags: Nag[]): boolean {
  return shouldShowNag(nags, Nag.ADD_UNICORN_BADGE);
}

export function shouldShowRecordReplay(nags: Nag[]): boolean {
  return shouldShowNag(nags, Nag.FIRST_REPLAY_2);
}

export function shouldShowExploreSources(nags: Nag[]): boolean {
  return shouldShowNag(nags, Nag.EXPLORE_SOURCES);
}

export function shouldShowSearchSourceText(nags: Nag[]): boolean {
  return shouldShowNag(nags, Nag.SEARCH_SOURCE_TEXT);
}

export function shouldShowShareNag(nags: Nag[]): boolean {
  return shouldShowNag(nags, Nag.SHARE);
}

export function shouldShowQuickOpenFile(nags: Nag[]): boolean {
  return shouldShowNag(nags, Nag.QUICK_OPEN_FILE);
}

export function shouldShowLaunchCommandPalette(nags: Nag[]): boolean {
  return shouldShowNag(nags, Nag.LAUNCH_COMMAND_PALETTE);
}

export function shouldShowJumpToEvent(nags: Nag[]): boolean {
  return shouldShowNag(nags, Nag.JUMP_TO_EVENT);
}

export function shouldShowJumpToNetworkRequest(nags: Nag[]): boolean {
  return shouldShowNag(nags, Nag.JUMP_TO_NETWORK_REQUEST);
}

export function shouldShowInspectElement(nags: Nag[]): boolean {
  return shouldShowNag(nags, Nag.INSPECT_ELEMENT);
}

export function shouldShowInspectComponent(nags: Nag[]): boolean {
  return shouldShowNag(nags, Nag.INSPECT_COMPONENT);
}

export function shouldShowFindFile(nags: Nag[]): boolean {
  return shouldShowNag(nags, Nag.FIND_FILE);
}

export function shouldShowUseFocusMode(nags: Nag[]): boolean {
  return shouldShowNag(nags, Nag.USE_FOCUS_MODE);
}

export function shouldShowInspectNetworkRequest(nags: Nag[]): boolean {
  return shouldShowNag(nags, Nag.INSPECT_NETWORK_REQUEST);
}

export function shouldShowInspectReactComponent(nags: Nag[]): boolean {
  return shouldShowNag(nags, Nag.INSPECT_COMPONENT);
}

export function shouldShowTour(nags: Nag[]): boolean {
  const showTour = shouldShowNag(nags, Nag.DISMISS_TOUR);
  const showBreakpointEdit = shouldShowBreakpointEdit(nags);
  return showTour && showBreakpointEdit;
}
