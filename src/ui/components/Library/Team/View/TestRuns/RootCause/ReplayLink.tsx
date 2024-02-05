export function ReplayLink({
  id,
  kind,
  result,
  point,
  time,
}: {
  id: string;
  kind: "extra" | "missing";
  result: "passing" | "failing";
  point: string;
  time: number;
}) {
  return (
    <a href={`/recording/${id}?point=${point}&time=${time}`} target="_blank" rel="noreferrer">
      Go to <span className="italic">{kind}</span> point in <span className="italic">{result}</span>{" "}
      replay
    </a>
  );
}
