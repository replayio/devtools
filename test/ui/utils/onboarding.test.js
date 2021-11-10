const { singleInvitation, firstReplay } = require("ui/utils/onboarding");
const { Nag } = require("ui/hooks/users");

describe("singleInvitation", () => {
  test("should return false if there's more than one invitation", () => {
    const invitationCount = 2;
    const workspaceCount = 0;

    expect(singleInvitation(invitationCount, workspaceCount)).toBe(false);
  });
  test("should return false if there are no invitations", () => {
    const invitationCount = 0;
    const workspaceCount = 0;

    expect(singleInvitation(invitationCount, workspaceCount)).toBe(false);
  });
  test("should return false if the user is already in a workspace", () => {
    const invitationCount = 1;
    const workspaceCount = 1;

    expect(singleInvitation(invitationCount, workspaceCount)).toBe(false);
  });
});

describe("firstReplay", () => {
  test("should return false if the user has already seen (or dismissed) the first replay nag", () => {
    expect(firstReplay([Nag.FIRST_REPLAY_2]).toBe(false));
  });
});
