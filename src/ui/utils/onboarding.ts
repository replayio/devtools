import { isReplayBrowser } from "ui/utils/environment";
import { Nag } from "ui/hooks/users";

import { shouldShowNag } from "./user";

function queryParams() {
  return new URL(window.location.href).searchParams;
}

export const isTeamLeaderInvite = () => queryParams().get("replayinvite");
export const hasTeamInvitationCode = () => queryParams().get("invitationcode");
export const isTeamReferral = () => hasTeamInvitationCode();

// This is for the user onboarding flow where the user opens the Replay
// browser for the first time. It teaches them how to create their first replay.
export function firstReplay(nags: Nag[]): boolean {
  if (isTeamReferral()) {
    return false;
  }

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
