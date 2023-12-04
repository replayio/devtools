export function UnsupportedTarget({ target }: { target: string }) {
  const url = new URL(window.location.href);
  url.pathname + url.search;

  return (
    <div className="flex h-full flex-col items-center justify-center space-y-4">
      <div>This player no longer supports recordings made with {target}.</div>

      <div>
        Please try{" "}
        <a
          className="pointer-hand underline"
          href={`https://legacy-app.replay.io/${url.pathname + url.search}`}
        >
          legacy-app.replay.io
        </a>{" "}
        instead.
      </div>
    </div>
  );
}
