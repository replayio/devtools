import React from "react";

export default function ViewerHeader({
  children,
}: {
  children: React.ReactChild | (React.ReactChild | null)[];
}) {
  return <div className="flex flex-row justify-between items-center">{children}</div>;
}

export function ViewerHeaderLeft({
  children,
}: {
  children: React.ReactChild | React.ReactChild[];
}) {
  return (
    <div className="flex flex-row space-x-2 text-2xl font-semibold items-center">{children}</div>
  );
}
