import React from "react";
import { PendingWorkspaceInvitation } from "ui/types";
import PendingTeamPrompt from "./PendingTeamPrompt";
import { getDurationString, getRelativeDate } from "./RecordingRow";
import RecordingTable from "./RecordingTable";

const MOCK_DATA = [
  { date: "2021-12-01T18:37:44.077Z", user: { name: "Jaril" } },
  { date: "2021-12-01T18:37:44.077Z", user: { name: "Jaril" } },
  { date: "2021-09-12T18:37:44.077Z", user: { name: "Jaril" } },
  { date: "2021-09-12T18:37:44.077Z", user: { name: "Jaril" } },
  { date: "2021-09-01T18:37:44.077Z", user: { name: "Jaril" } },
  { date: "2021-09-01T18:37:44.077Z", user: { name: "Jaril" } },
  { date: "2021-06-12T18:37:44.077Z", user: { name: "Jaril" } },
  { date: "2021-06-12T18:37:44.077Z", user: { name: "Jaril" } },
  { date: "2021-06-01T18:37:44.077Z", user: { name: "Jaril" } },
  { date: "2021-06-01T18:37:44.077Z", user: { name: "Jaril" } },
  { date: "2021-02-12T18:37:44.077Z", user: { name: "Jaril" } },
  { date: "2021-02-12T18:37:44.077Z", user: { name: "Jaril" } },
  { date: "2021-01-12T18:37:44.077Z", user: { name: "Jaril" } },
  { date: "2021-01-12T18:37:44.077Z", user: { name: "Jaril" } },
  { date: "2021-01-01T18:37:44.077Z", user: { name: "Jaril" } },
  { date: "2021-01-01T18:37:44.077Z", user: { name: "Jaril" } },
];

function MockRecordingRow({ date, name }: { date: string; name: string }) {
  return (
    <tr className="group border-b border-gray-200 hover:bg-gray-50 transition duration-200 cursor-pointer overflow-hidden">
      <td className="text-center"></td>
      <td className="py-3 px-6 text-left overflow-hidden">
        <div className="flex flex-row items-center space-x-4 overflow-hidden">
          <div className="bg-gray-100 rounded-sm w-16 h-9"></div>

          <div className="flex flex-col overflow-hidden" style={{ maxWidth: "200px" }}>
            <div className="text-gray-900 font-bold overflow-hidden overflow-ellipsis whitespace-pre">
              jQuery - TodoMVC
            </div>
            <div className="text-gray-400 overflow-hidden overflow-ellipsis whitespace-pre">
              {`https://todomvc.com/examples/jquery/#/all`}
            </div>
          </div>
        </div>
      </td>
      <td className="text-center">{getDurationString(Math.floor(Math.random() * 120000))}</td>
      <td className="text-center">{getRelativeDate(date)}</td>
      <td className="text-center">{Math.random() > 0.5 ? "Private" : "Public"}</td>
      <td className="text-center overflow-hidden overflow-ellipsis whitespace-pre">{name}</td>
      <td className="text-center">{`${Math.floor(Math.random() * 20)} 💬`}</td>
      <td className="text-center opacity-0 group-hover:opacity-100"></td>
    </tr>
  );
}

export function PendingTeamScreen({ workspace }: { workspace: PendingWorkspaceInvitation }) {
  const { name } = workspace;

  return (
    <div className="flex flex-col px-8 py-6 bg-gray-100 space-y-5 -5 overflow-auto">
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-row space-x-2 text-2xl font-semibold items-center">
          <span>{name}</span>
          <div
            className="text-xs bg-blue-500 text-white rounded-lg px-2 py-0.5"
            style={{ height: "fit-content" }}
          >
            New
          </div>
        </div>
      </div>
      <div className="relative overflow-hidden">
        <RecordingTable isMock>
          {MOCK_DATA.map((r, i) => (
            <MockRecordingRow date={r.date} key={i} name={r.user.name} />
          ))}
        </RecordingTable>
        <PendingTeamPrompt {...{ workspace }} />
      </div>
    </div>
  );
}
