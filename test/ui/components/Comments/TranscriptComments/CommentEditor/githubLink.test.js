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
});
