import { useEffect, useState } from "react";

export function UnsupportedTarget() {
  const url = new URL(window.location.href);
  const redirectUrl = `https://legacy.replay.io${url.pathname + url.search}`;

  const [count, setCount] = useState(5);

  useEffect(() => {
    if (count <= 0) {
      window.location.href = redirectUrl;
    } else {
      const timeout = setTimeout(() => {
        setCount(count - 1);
      }, 1000);

      return () => {
        clearTimeout(timeout);
      };
    }
  }, [count, redirectUrl]);

  return (
    <div className="flex h-full items-center justify-center space-y-4">
      <div>
        Redirecting to{" "}
        <a className="pointer-hand underline" href={redirectUrl}>
          legacy.replay.io
        </a>{" "}
        in {count}...
      </div>
    </div>
  );
}
