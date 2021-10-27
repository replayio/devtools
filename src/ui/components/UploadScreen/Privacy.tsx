import uniq from "lodash/uniq";
import React, { Dispatch, SetStateAction } from "react";
import { OperationsData } from "ui/types";
import MaterialIcon from "../shared/MaterialIcon";

export function getUniqueDomains(operations: OperationsData) {
  const cookies = operations.cookies || [];
  const storage = operations.storage || [];
  let domains = [...operations.scriptDomains, ...cookies, ...storage];

  return uniq(domains);
}

export function ToggleShowPrivacyButton({
  showPrivacy,
  operations,
  setShowPrivacy,
}: {
  showPrivacy: boolean;
  operations: OperationsData;
  setShowPrivacy: Dispatch<SetStateAction<boolean>>;
}) {
  const uniqueDomains = getUniqueDomains(operations);

  return (
    <button
      type="button"
      onClick={() => setShowPrivacy(!showPrivacy)}
      className="p-3 bg-jellyfish rounded-lg font-normal text-left w-full flex flex-row items-center justify-between group"
    >
      <div className="space-x-2 flex flex-row items-center">
        <MaterialIcon>storage</MaterialIcon>
        <span>Contains potentially sensitive data from {uniqueDomains.length} domains</span>
      </div>
      <MaterialIcon className="opacity-0 group-hover:opacity-100">
        {showPrivacy ? "chevron_left" : "chevron_right"}
      </MaterialIcon>
    </button>
  );
}

function FavIcon({ url }: { url: string }) {
  return (
    <div className="h-5 w-5 relative">
      <MaterialIcon className="leading-5 relative" style={{ fontSize: "1.25rem" }}>
        public
      </MaterialIcon>
      <img
        className="h-5 w-5 absolute top-0 left-0 bg-white"
        src={`https://api.faviconkit.com/${url}`}
      />
    </div>
  );
}

function Source({ url }: { url: string }) {
  return (
    <div className="flex space-x-3 items-center">
      <FavIcon url={url} />
      <div>{url}</div>
    </div>
  );
}

function PrivacyData({ icon, name, urls }: { icon: string; name: string; urls: string[] }) {
  return (
    <div className="rounded-lg bg-jellyfish p-3 space-y-3">
      <div className="space-x-2 flex flex-row font-medium items-center">
        <MaterialIcon>{icon}</MaterialIcon>
        <div>{name}</div>
      </div>
      <div className="flex flex-col space-y-1.5">
        {urls.map((u, i) => (
          <Source url={u} key={i} />
        ))}
      </div>
    </div>
  );
}

export function Privacy({ operations }: { operations: OperationsData }) {
  return (
    <div
      className="flex rounded-xl shadow-xl text-lg relative p-8 bg-jellyfish overflow-hidden"
      style={{ width: "440px" }}
    >
      <div className="flex flex-col space-y-7 overflow-hidden">
        <div className="flex flex-col space-y-1">
          <div className="text-2xl font-bold">Privacy</div>
          <div className="">
            {`Replays include all of the data needed to replay the browser. `}
            <a
              href="https://www.replay.io/security-privacy"
              target="_blank"
              rel="noreferrer"
              className="underline text-primaryAccent"
            >
              Learn more
            </a>
          </div>
        </div>
        <div className="flex flex-col space-y-5 overflow-auto">
          {operations.cookies ? (
            <PrivacyData icon="cookie" name="Cookies" urls={operations.cookies} />
          ) : null}
          {operations.storage ? (
            <PrivacyData icon="storage" name="Local Storage" urls={operations.storage} />
          ) : null}
          <PrivacyData
            icon="insert_drive_file"
            name="Executed Scripts"
            urls={operations.scriptDomains}
          />
        </div>
      </div>
    </div>
  );
}
