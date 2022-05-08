export default function ActionSummary() {
  const selectedAction = useSelector(getSelectedAction);
  const selectedMode = useSelector(getSelectedMode);

  if (selectedMode == "payload") {
    // probably from our own json view
    return <JSONVIEW />;
  }

  if (selectedMode == "state") {
    // probably from our own json view
    return <JSONVIEW />;
  }

  if (selectedMode == "diff") {
    // probably from redux-devtools-app/lib/cjs/components/Diff.js
    return <DiffView />;
  }

  if (selectedMode == "stack") {
    // probably from our own stack trace view
    return <StackTrace />;
  }
}
