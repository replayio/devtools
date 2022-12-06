import { useEffect, useState } from "react";

export default function LoadingLabelPlaceholder({
  interval = 250,
  maxDots = 3,
}: {
  interval?: number;
  maxDots?: number;
}) {
  const [count, setCount] = useState(1);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCount(prevCount => prevCount + 1);
    }, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [interval]);

  const dots = ".".repeat(count % (maxDots + 1));

  return <span className="tok-comment">{`// Loading ${dots}`}</span>;
}
