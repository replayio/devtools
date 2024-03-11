export function UnsupportedTarget({ target }: { target: string }) {
  const url = new URL(window.location.href);
  url.pathname + url.search;

  return (
    <div className="flex h-full items-center justify-center space-y-4">
      <div>
        Recordings made with <strong>{target}</strong> must be viewed at{" "}
        <a
          className="pointer-hand underline"
          href={`https://legacy.replay.io${url.pathname + url.search}`}
        >
          legacy.replay.io
        </a>
        .
      </div>
    </div>
  );
}
