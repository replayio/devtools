import { useContext, useEffect, useState } from "react";
import { TestRunResultsList } from "./TestRunResultsList";
import { TestRunsContext } from "../TestRunsPage";
import { testRunsData } from "../useGetTestRuns";

const getTestRun = (id: string) => {
  const run = testRunsData.find(r => r.id === id);
  return {
    ...run,
    recordings: [
      { title: "breakpoints should have basic functionality" },
      { title: "breakpoints should not diverge" },
      { title: "breakpoints should support catch, finally, generators, and async/await" },
      { title: "breakpoints should create a script" },
      { title: "breakpoints should interact properly with debugger statements" },
      { title: "breakpoints should work well with sourcemaps" },
      { title: "stepping should work as expected" },
      { title: "inspector should should contents when paused" },
      { title: "inspector should work with the element picker" },
      { title: "inspector styles should be viewable" },
      { title: "inspector rule view should not bomb" },
      { title: "inspector rule view should work with source mapped style sheets" },
      { title: "stepping should work for simple stepping bugs" },
      { title: "stepping past the beginning/end of a frame should act like a step out" },
      { title: "stepping should work in blackboxed sources" },
      { title: "stepping should work with pretty printed code" },
    ],
  };
};

function useGetTestRun() {
  const [loading, setLoading] = useState(true);
  const { focusId } = useContext(TestRunsContext);

  useEffect(() => {
    setLoading(true);
  }, [focusId]);

  useEffect(() => {
    if (loading) {
      setTimeout(() => setLoading(false), 1000);
    }
  }, [loading, setLoading]);

  return loading
    ? { testRun: null, loading: true }
    : { testRun: getTestRun(focusId), loading: false };
}

export function TestRunOverview() {
  const { testRun, loading } = useGetTestRun();

  return (
    <div className="flex flex-col w-1/3 p-4 space-y-4 bg-sky-300">
      {loading ? <div>Loading</div> : (
        <>
          <div>{testRun.title}</div>
          {<TestRunResultsList results={testRun.recordings} />}
        </>
      )}
    </div>
  );
}
