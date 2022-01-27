import React from "react";
import { PendingWorkspaceInvitation } from "ui/types";
import { getDisplayedUrl } from "ui/utils/environment";
import PendingTeamPrompt from "./PendingTeamPrompt";
import { getDurationString, getRelativeDate } from "./RecordingRow";

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
  { date: "2021-01-01T18:37:44.077Z", user: { name: "Jaril" } },
  { date: "2021-01-01T18:37:44.077Z", user: { name: "Jaril" } },
  { date: "2021-01-01T18:37:44.077Z", user: { name: "Jaril" } },
  { date: "2021-01-01T18:37:44.077Z", user: { name: "Jaril" } },
  { date: "2021-01-01T18:37:44.077Z", user: { name: "Jaril" } },
];

function MockRecordingRow({ date, name }: { date: string; name: string }) {
  return (
    <div className="group border-b border-gray-200 hover:bg-gray-50 transition duration-200 cursor-pointer flex flex-row">
      <div className="py-3 px-1 overflow-hidden whitespace-pre overflow-ellipsis w-8 flex-shrink-0" />
      <div className="py-3 px-1 overflow-hidden whitespace-pre overflow-ellipsis flex-grow">
        <div className="flex flex-row items-center space-x-4 overflow-hidden">
          <div className="bg-gray-100 rounded-sm w-16 h-9 flex-shrink-0 overflow-hidden" />
          <div className="flex flex-col overflow-hidden space-y-0.5">
            <div className="text-gray-900 overflow-hidden overflow-ellipsis whitespace-pre">
              jQuery - TodoMVC
            </div>
            <div className="flex flex-row space-x-4 text-gray-500">
              <div
                className="flex flex-row items-center overflow-hidden whitespace-pre overflow-ellipsis space-x-1"
                style={{ minWidth: "5rem" }}
              >
                <img src="/images/timer.svg" className="w-3" />
                <span>{getDurationString(Math.floor(Math.random() * 120000))}</span>
              </div>
              <div
                className="flex flex-row items-center overflow-hidden whitespace-pre overflow-ellipsis space-x-1"
                style={{ minWidth: "6rem" }}
              >
                <img src="/images/today.svg" className="w-3" />
                <span>{getRelativeDate(date)}</span>
              </div>
              <div className="text-gray-400 overflow-hidden overflow-ellipsis whitespace-pre">
                {getDisplayedUrl("https://todomvc.com/examples/jquery/#/all")}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="py-3 px-1 overflow-hidden whitespace-pre overflow-ellipsis w-16 flex-shrink-0 my-auto">
        {Math.random() > 0.5 ? "Private" : "Public"}
      </div>
      <div className="py-3 px-1 overflow-hidden whitespace-pre overflow-ellipsis w-36 flex-shrink-0 my-auto">
        {name}
      </div>
      <div className="py-3 px-1 overflow-hidden whitespace-pre overflow-ellipsis w-16 flex-shrink-0 flex flex-row items-center">
        <div className="inline-block">
          <div className="flex flex-row space-x-1">
            <span>{Math.floor(Math.random() * 20)}</span>
            <img src="/images/comment-outline.svg" className="w-3" />
          </div>
        </div>
      </div>
      <div className="py-3 px-1 w-8 flex-shrink-0 flex flex-row items-center justify-center" />
    </div>
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
        <div className="flex flex-col rounded-md shadow-md bg-white text-default overflow-y-auto recording-list filter blur-sm">
          {MOCK_DATA.map((r, i) => (
            <MockRecordingRow date={r.date} key={i} name={r.user.name} />
          ))}
        </div>
        <PendingTeamPrompt {...{ workspace }} />
      </div>
    </div>
  );
}
