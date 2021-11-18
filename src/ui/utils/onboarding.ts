import { Nag } from "ui/hooks/users";
import { isReplayBrowser, url } from "./environment";
import { shouldShowNag } from "./user";

function queryParams() {
  return url.searchParams;
}

export const isTeamMemberInvite = () => queryParams().get("teaminvite");
export const isTeamLeaderInvite = () => queryParams().get("replayinvite");
export const hasTeamInvitationCode = () => queryParams().get("invitationcode");
export const isTeamReferral = () => isTeamMemberInvite() || hasTeamInvitationCode();

// This is for the user onboarding flow where the user signs up for Replay using
// a Replay team invite that they received in their email.
export const singleInvitation = (invitations: number, workspaces: number): boolean =>
  invitations === 1 && workspaces === 0;

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
