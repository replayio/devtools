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
    <div className="group flex cursor-pointer flex-row border-b border-gray-200 transition duration-200 hover:bg-gray-50">
      <div className="w-8 flex-shrink-0 overflow-hidden overflow-ellipsis whitespace-pre py-3 px-1" />
      <div className="flex-grow overflow-hidden overflow-ellipsis whitespace-pre py-3 px-1">
        <div className="flex flex-row items-center space-x-4 overflow-hidden">
          <div className="h-9 w-16 flex-shrink-0 overflow-hidden rounded-sm bg-gray-100" />
          <div className="flex flex-col space-y-0.5 overflow-hidden">
            <div className="overflow-hidden overflow-ellipsis whitespace-pre text-gray-900">
              jQuery - TodoMVC
            </div>
            <div className="flex flex-row space-x-4 text-gray-500">
              <div
                className="flex flex-row items-center space-x-1 overflow-hidden overflow-ellipsis whitespace-pre"
                style={{ minWidth: "5rem" }}
              >
                <img src="/images/timer.svg" className="w-3" />
                <span>{getDurationString(Math.floor(Math.random() * 120000))}</span>
              </div>
              <div
                className="flex flex-row items-center space-x-1 overflow-hidden overflow-ellipsis whitespace-pre"
                style={{ minWidth: "6rem" }}
              >
                <img src="/images/today.svg" className="w-3" />
                <span>{getRelativeDate(date)}</span>
              </div>
              <div className="overflow-hidden overflow-ellipsis whitespace-pre text-gray-400">
                {getDisplayedUrl("https://todomvc.com/examples/jquery/#/all")}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="my-auto w-16 flex-shrink-0 overflow-hidden overflow-ellipsis whitespace-pre py-3 px-1">
        {Math.random() > 0.5 ? "Private" : "Public"}
      </div>
      <div className="my-auto w-36 flex-shrink-0 overflow-hidden overflow-ellipsis whitespace-pre py-3 px-1">
        {name}
      </div>
      <div className="flex w-16 flex-shrink-0 flex-row items-center overflow-hidden overflow-ellipsis whitespace-pre py-3 px-1">
        <div className="inline-block">
          <div className="flex flex-row space-x-1">
            <span>{Math.floor(Math.random() * 20)}</span>
            <img src="/images/comment-outline.svg" className="w-3" />
          </div>
        </div>
      </div>
      <div className="flex w-8 flex-shrink-0 flex-row items-center justify-center py-3 px-1" />
    </div>
  );
}

export function PendingTeamScreen({ workspace }: { workspace: PendingWorkspaceInvitation }) {
  const { name } = workspace;

  return (
    <div className="-5 flex flex-col space-y-5 overflow-auto bg-gray-100 px-8 py-6">
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
        <div className="recording-list flex flex-col overflow-y-auto rounded-md bg-bodyBgcolor text-sm shadow-md blur-sm filter">
          {MOCK_DATA.map((r, i) => (
            <MockRecordingRow date={r.date} key={i} name={r.user.name} />
          ))}
        </div>
        <PendingTeamPrompt {...{ workspace }} />
      </div>
    </div>
  );
}
