const {
  inputRegex,
} = require("ui/components/Comments/TranscriptComments/CommentEditor/githubLink");

describe("GitHubLink", () => {
  test("when there are no github links it does not match", () => {
    expect("text with no link".match(inputRegex)).toEqual(null);
  });

  test("when there are github links it does match", () => {
    expect("https://github.com/RecordReplay/devtools/issues/3926".match(inputRegex)).toEqual([
      "https://github.com/RecordReplay/devtools/issues/3926",
    ]);
  });

  test("when the link has other text on both sides it only matches the link", () => {
    expect(
      "Beginning https://github.com/RecordReplay/devtools/issues/3926 end".match(inputRegex)
    ).toEqual(["https://github.com/RecordReplay/devtools/issues/3926"]);
  });

  test("when the link has query params it matches them but not in the ID", () => {
    expect(
      [
        ..."Beginning https://github.com/RecordReplay/devtools/issues/3926?foo end".matchAll(
          inputRegex
        ),
      ][0]
    ).toContain("https://github.com/RecordReplay/devtools/issues/3926?foo", "3926");
  });
});
