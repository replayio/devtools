import React from "react";
import { getDisplayedUrl } from "ui/utils/environment";
import { PendingWorkspaceInvitation } from "ui/types";

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
    <div className="flex flex-row transition duration-200 border-b border-gray-200 cursor-pointer group hover:bg-gray-50">
      <div className="flex-shrink-0 w-8 px-1 py-3 overflow-hidden whitespace-pre overflow-ellipsis" />
      <div className="flex-grow px-1 py-3 overflow-hidden whitespace-pre overflow-ellipsis">
        <div className="flex flex-row items-center space-x-4 overflow-hidden">
          <div className="flex-shrink-0 w-16 overflow-hidden bg-gray-100 rounded-sm h-9" />
          <div className="flex flex-col space-y-0.5 overflow-hidden">
            <div className="overflow-hidden text-gray-900 whitespace-pre overflow-ellipsis">
              jQuery - TodoMVC
            </div>
            <div className="flex flex-row space-x-4 text-gray-500">
              <div
                className="flex flex-row items-center space-x-1 overflow-hidden whitespace-pre overflow-ellipsis"
                style={{ minWidth: "5rem" }}
              >
                <img src="/images/timer.svg" className="w-3" />
                <span>{getDurationString(Math.floor(Math.random() * 120000))}</span>
              </div>
              <div
                className="flex flex-row items-center space-x-1 overflow-hidden whitespace-pre overflow-ellipsis"
                style={{ minWidth: "6rem" }}
              >
                <img src="/images/today.svg" className="w-3" />
                <span>{getRelativeDate(date)}</span>
              </div>
              <div className="overflow-hidden text-gray-400 whitespace-pre overflow-ellipsis">
                {getDisplayedUrl("https://todomvc.com/examples/jquery/#/all")}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 w-16 px-1 py-3 my-auto overflow-hidden whitespace-pre overflow-ellipsis">
        {Math.random() > 0.5 ? "Private" : "Public"}
      </div>
      <div className="flex-shrink-0 px-1 py-3 my-auto overflow-hidden whitespace-pre w-36 overflow-ellipsis">
        {name}
      </div>
      <div className="flex flex-row items-center flex-shrink-0 w-16 px-1 py-3 overflow-hidden whitespace-pre overflow-ellipsis">
        <div className="inline-block">
          <div className="flex flex-row space-x-1">
            <span>{Math.floor(Math.random() * 20)}</span>
            <img src="/images/comment-outline.svg" className="w-3" />
          </div>
        </div>
      </div>
      <div className="flex flex-row items-center justify-center flex-shrink-0 w-8 px-1 py-3" />
    </div>
  );
}

export function PendingTeamScreen({ workspace }: { workspace: PendingWorkspaceInvitation }) {
  const { name } = workspace;

  return (
    <div className="flex flex-col w-full px-8 py-6 space-y-5 overflow-auto -5">
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-row items-center space-x-2 text-2xl font-semibold">
          <span>{name}</span>
          <div
            className="rounded-lg bg-blue-500 px-2 py-0.5 text-xs text-white"
            style={{ height: "fit-content" }}
          >
            New
          </div>
        </div>
      </div>
      <div className="relative overflow-hidden">
        <div className="flex flex-col overflow-y-auto text-sm rounded-md shadow-md recording-list bg-bodyBgcolor blur-sm filter">
          {MOCK_DATA.map((r, i) => (
            <MockRecordingRow date={r.date} key={i} name={r.user.name} />
          ))}
        </div>
        <PendingTeamPrompt {...{ workspace }} />
      </div>
    </div>
  );
}
