import { useContext, useEffect, useState } from "react";
import { ViewContext } from "../ViewPage";

export const testRunsData = [
  {
    title: "Console warning/error/trace stack (#7267)",
    author: "jasonLaster",
    id: "027539616704632897",
  },
  {
    title: "Always run `yarn install` after restoring cache in CI (#7275)",
    author: "jasonLaster",
    id: "3098593610709215",
  },
  {
    title: "Console warning/error/trace stack",
    author: "jasonLaster",
    id: "6299065244958129",
  },
  {
    title: "Always run `yarn install` after restoring cache in CI",
    author: "markerikson",
    id: "07250690302456331",
  },
  {
    title: "Update lock file",
    author: "markerikson",
    id: "7638947294335676",
  },
  {
    title: "Add Heat Maps to the appearances panel",
    author: "markerikson",
    id: "20797358650631548",
  },
  {
    title: "Fixed a double click handler",
    author: "markerikson",
    id: "9535404456111853",
  },
  {
    title: "You win, TSC. I'll rename the file.",
    author: "markerikson",
    id: "6911813550829713",
  },
  {
    title: "Add Heat Maps to the appearances panel",
    author: "markerikson",
    id: "20379059797008625",
  },
  {
    title: "Add Heat Maps to the appearances panel",
    author: "markerikson",
    id: "9750352489090133",
  },
  {
    title: "Console warning/error/trace stack\n\nAdd support for toggleable stack frames for c...",
    author: "markerikson",
    id: "945570021694838",
  },
  {
    title: "Add Heat Maps to the appearances panel",
    author: "jasonLaster",
    id: "15350391565702015",
  },
  {
    title: "Persist hit counts mode",
    author: "jasonLaster",
    id: "9079488800850084",
  },
  {
    title: "Persist hit counts mode",
    author: "jasonLaster",
    id: "5561313934114838",
  },
  {
    title: "Re-add Collapsible",
    author: "jasonLaster",
    id: "039171984519108305",
  },
  {
    title: "Fix GraphQL Schema error (#7271)",
    author: "jasonLaster",
    id: "8952297426076874",
  },
  {
    title: "Fixed bad import that TSC didn't report locally",
    author: "jasonLaster",
    id: "3692499034472463",
  },
  {
    title: "Hit count component properly removes empty-line class (#7270)",
    author: "jasonLaster",
    id: "26823735190829434",
  },
  {
    title: "Hit count component properly removes empty-line class",
    author: "jasonLaster",
    id: "013979089315779847",
  },
  {
    title: "Convert getBreakpointsForSource to memoized selector\n\nThis was causing a lot of ...",
    author: "jasonLaster",
    id: "08896390440603552",
  },
  {
    title: "Temporarily remove Add Comment (#7268)",
    author: "jasonLaster",
    id: "29913584598094567",
  },
  {
    title: "Temporarily remove Add Comment",
    author: "jasonLaster",
    id: "08230868692134896",
  },
  {
    title: "try and improve the editor gutter context menus",
    author: "jasonLaster",
    id: "20283107944593026",
  },
  {
    title: "Remove getDescription threadfront call (#7265)",
    author: "jasonLaster",
    id: "5594055251198313",
  },
  {
    title: "Fix Next compile error in bvaughn prototype (#7264)",
    author: "jasonLaster",
    id: "29625916064550584",
  },
  {
    title: "Show test results (#7219)",
    author: "jasonLaster",
    id: "4526587384816856",
  },
  {
    title: "Fix Next compile error in bvaughn prototype",
    author: "jasonLaster",
    id: "3387289561801363",
  },
  {
    title: "Only show the workspace's view options for test workspaces (#7252)",
    author: "jasonLaster",
    id: "9652778889501452",
  },
  {
    title: "Use react-window for Console auto complete typeahead (#7263)\n\nFix one of the out...",
    author: "jasonLaster",
    id: "05435415182902248",
  },
  {
    title: "Use react-window for Console auto complete typeahead",
    author: "jasonLaster",
    id: "9469046632847378",
  },
  {
    title: "Only show the workspace's view options for test workspaces",
    author: "jasonLaster",
    id: "05500244423208267",
  },
  {
    title: "Fix opening the test run link",
    author: "jasonLaster",
    id: "7433996508843086",
  },
  {
    title: "Fix opening the test run link",
    author: "jasonLaster",
    id: "653658519989458",
  },
  {
    title: "Fixed hit count bug (#7260)\n\n* Fix a few possible NaN and Infinity cases for the...",
    author: "jasonLaster",
    id: "36093548196199166",
  },
  {
    title: "Position add-comment button to not overlap the hit count gutter",
    author: "bvaughn",
    id: "7488538345877602",
  },
  {
    title: "Initialize test workspaces to test run",
    author: "bvaughn",
    id: "07948457801067943",
  },
  {
    title: "Show test results",
    author: "markerikson",
    id: "0012220944003740186",
  },
  {
    title: "Nicer link copy (#7261)",
    author: "jaril",
    id: "3289202750840603",
  },
  {
    title: "Position add-comment button to not overlap the hit count gutter",
    author: "jaril",
    id: "7218055635096061",
  },
  {
    title: "Fix Next/Webpack build config",
    author: "jaril",
    id: "7203114426702344",
  },
  {
    title: "Update line hit count heatmap",
    author: "jaril",
    id: "13375832260424603",
  },
  {
    title: "Add new Object Inspector UI to Source viewer (as experiment) (#7251)\n\nAdd new Ob...",
    author: "jaril",
    id: "8803251362534839",
  },
  {
    title: "Remove getDescription (#7253)",
    author: "jaril",
    id: "8191374627997383",
  },
  {
    title: "Remove getDescription",
    author: "jaril",
    id: "5753769444527124",
  },
  {
    title: "fix line hit counts plus button (#7254)",
    author: "jaril",
    id: "1071458279999471",
  },
  {
    title: "Remove dead package-lock.json",
    author: "jaril",
    id: "4346449260531824",
  },
  {
    title: "Add new Object Inspector to Scopes panel too",
    author: "jaril",
    id: "9621701848117854",
  },
  {
    title: "Remove getDescription",
    author: "jaril",
    id: "6606703029062124",
  },
  {
    title: "fix line hit counts plus button",
    author: "jaril",
    id: "8474952613544671",
  },
  {
    title: "Update remaining docs references to `npm install`",
    author: "jaril",
    id: "057083785202744375",
  },
];

export function useGetTestRuns() {
  const [loading, setLoading] = useState(true);
  const { view } = useContext(ViewContext);

  useEffect(() => {
    setLoading(true);
  }, [view]);

  useEffect(() => {
    if (loading) {
      setTimeout(() => setLoading(false), 1000);
    }
  }, [loading, setLoading]);

  return loading
    ? { testRun: null, loading: true }
    : { results: testRunsData, loading: false };
}
