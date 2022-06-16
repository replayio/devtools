import { useContext } from "react";
import { RunResults } from "./RunResults";
import { RunSummary } from "./RunSummary";
import { OverviewContainer, OverviewContext } from "./OverviewContainer";
import Spinner from "ui/components/shared/Spinner";

export function TestRunOverview() {
  return (
    <OverviewContainer>
      <OverviewContent />
    </OverviewContainer>
  );
}

function OverviewContent() {
  const { loading } = useContext(OverviewContext);

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <Spinner className="w-4 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <RunSummary />
      <RunResults />
    </>
  );
}
