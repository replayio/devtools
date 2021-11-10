import { Nag } from "ui/hooks/users";
import { isReplayBrowser, url } from "./environment";
import { shouldShowNag } from "./user";

function queryParams() {
  return url.searchParams;
}

export const isTeamMemberInvite = () => queryParams().get("teaminvite");
export const hasTeamInvitationCode = () => queryParams().get("invitationcode");
export const isTeamReferral = () => isTeamMemberInvite() || hasTeamInvitationCode();

// This is for the user onboarding flow where the user signs up for Replay using
// a Replay team invite that they received in their email.
export const singleInvitation = (invitations: number, workspaces: number) =>
  invitations === 1 && workspaces === 0;

// This is for the user onboarding flow where the user opens the Replay
// browser for the first time. It teaches them how to create their first replay.
export function firstReplay(nags: Nag[]) {
  if (isTeamReferral()) return false;
  return shouldShowNag(nags, Nag.FIRST_REPLAY_2) && isReplayBrowser();
}
