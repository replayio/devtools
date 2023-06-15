import { ReactElement } from "react";

export default function HighlightedText({
  className = "pre-wrap truncate",
  haystack,
  needle,
}: {
  className?: string;
  haystack: string;
  needle: string;
}) {
  if (haystack && needle) {
    const index = haystack.toLowerCase().indexOf(needle.toLowerCase());
    if (index >= 0) {
      return (
        <div className={className}>
          {haystack.slice(0, index)}
          <mark>{haystack.slice(index, index + needle.length)}</mark>
          {haystack.slice(index + needle.length)}
        </div>
      );
    }
  }

  return <div className={className}>{haystack}</div>;
}
