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
      <table className={classNames("w-full relative", isMock && "filter blur-sm")}>
        <thead className="bg-gray-50 font-normal text-xs uppercase text-gray-500 sticky top-0 w-full">
          <tr className="border-b border-gray-200">
            <th className="py-3 px-4"></th>
            <th className="py-3 px-6 text-left">Title</th>
            <th className="py-3 px-6">Length</th>
            <th className="py-3 px-6">Created</th>
            <th className="py-3 px-6">Privacy</th>
            <th className="py-3 px-6">Owner</th>
            <th className="py-3 px-6">Activity</th>
            <th className="py-3 px-4"></th>
          </tr>
        </thead>
        <tbody className="bg-white text-sm text-gray-500 overflow-hidden">{children}</tbody>
      </table>
    </div>
  );
}
