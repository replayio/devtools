import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { selectLocation } from "../../actions/sources";
import { getThreadContext } from "../../selectors";
import { CypressResult } from "ui/hooks/useFetchCypressSpec";

export default function CypressInfo({ results }: { results: CypressResult[] }) {
  const dispatch = useAppDispatch();
  const cx = useAppSelector(getThreadContext);

  return (
    <div>
      {results.map(result => (
        <div
          className="ml-2 cursor-pointer p-1"
          key={result.test}
          onClick={() => dispatch(selectLocation(cx, result.location as any))}
        >
          {result.test}
        </div>
      ))}
    </div>
  );
}
