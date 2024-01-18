export default function HighlightedText({
  haystack,
  needle,
}: {
  haystack: string;
  needle: string;
}) {
  if (haystack && needle) {
    const index = haystack.toLowerCase().indexOf(needle.toLowerCase());
    if (index >= 0) {
      return (
        <div className="pre-wrap truncate">
          {haystack.slice(0, index)}
          <mark>{haystack.slice(index, index + needle.length)}</mark>
          {haystack.slice(index + needle.length)}
        </div>
      );
    }
  }

  return <div className="pre-wrap truncate">{haystack}</div>;
}
