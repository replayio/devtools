import classNames from "classnames";
import React from "react";

export default function RecordingTable({
  children,
  isMock,
}: {
  children: React.ReactChild[];
  isMock?: boolean;
}) {
  return (
    <div
      className={classNames(
        "recording-list rounded-md shadow-md",
        isMock ? "overflow-hidden pointer-events-none" : "overflow-auto"
      )}
    >
      <table className={classNames("w-full relative table-fixed", isMock && "filter blur-sm")}>
        <thead className="bg-gray-50 font-normal text-xs uppercase text-gray-500 sticky top-0 w-full z-10">
          <tr className="border-b border-gray-200">
            <Cell isHeader className="w-12" />
            <Cell isHeader className="w-auto" alignment="left">
              Title
            </Cell>
            <Cell isHeader className="w-32">
              Length
            </Cell>
            <Cell isHeader className="w-32">
              Created
            </Cell>
            <Cell isHeader className="w-32">
              Privacy
            </Cell>
            <Cell isHeader className="w-40">
              Owner
            </Cell>
            <Cell isHeader className="w-32">
              Activity
            </Cell>
            <Cell isHeader className="w-20" />
          </tr>
        </thead>
        <tbody className="bg-white text-sm text-gray-500 overflow-hidden">{children}</tbody>
      </table>
    </div>
  );
}

export function Cell({
  className,
  children,
  alignment = "center",
  isHeader,
}: {
  children?: string | React.ReactChild | null;
  className?: string;
  alignment?: "left" | "center";
  isHeader?: boolean;
}) {
  const classes = classNames(
    className,
    "py-3 px-4",
    "overflow-hidden whitespace-pre overflow-ellipsis",
    alignment === "left" ? "text-left" : "text-center"
  );

  if (isHeader) {
    return <th className={classes}>{children}</th>;
  } else {
    return <td className={classes}>{children}</td>;
  }
}
