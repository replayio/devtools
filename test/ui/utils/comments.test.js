const { commentKeys } = require("ui/utils/comments");

describe("commentKeys", () => {
  test("keeps the same order even when the createdAt times changes a bit", () => {
    const frozenNow = Date.now();
    const secondsAgo = seconds => new Date(frozenNow - seconds * 1000);

    const optimisticResponse = [
      { user: { id: "1" }, createdAt: secondsAgo(30) },
      { user: { id: "1" }, createdAt: secondsAgo(15) },
    ];
    const serverResponse = [
      { user: { id: "1" }, createdAt: secondsAgo(28) },
      { user: { id: "1" }, createdAt: secondsAgo(14) },
    ];

    expect(commentKeys(optimisticResponse)).toEqual([0, 1]);
    expect(commentKeys(serverResponse)).toEqual([0, 1]);
  });
});
