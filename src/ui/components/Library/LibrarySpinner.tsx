import Spinner from "replay-next/components/Spinner";

// This is not the final way for us to indicate that we're loading some data.
// But for now, I'm using this for all of the Library's loading states so that
// it's easier to 1) identify them visually, and 2) search for where in the code
// they all are.
export function LibrarySpinner() {
  return (
    <div className="flex justify-center p-4">
      <Spinner className="h-4 w-4 animate-spin text-gray-500" />
    </div>
  );
}
