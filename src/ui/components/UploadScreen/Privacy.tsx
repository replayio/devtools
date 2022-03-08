import uniq from "lodash/uniq";
import React, { Dispatch, SetStateAction } from "react";
import { useGetRecording } from "ui/hooks/recordings";
import { getRecordingId } from "ui/utils/recording";
import { OperationsData } from "ui/types";
import ExternalLink from "../shared/ExternalLink";
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
      className="group flex w-full flex-row items-center justify-between rounded-lg bg-jellyfish p-3 text-left font-normal"
    >
      <div className="flex flex-row items-center space-x-2">
        <MaterialIcon iconSize="xl">storage</MaterialIcon>
        <span>Contains potentially sensitive data from {uniqueDomains.length} domains</span>
      </div>
      <MaterialIcon className="opacity-0 group-hover:opacity-100" iconSize="xl">
        {showPrivacy ? "chevron_left" : "chevron_right"}
      </MaterialIcon>
    </button>
  );
}

function FavIcon({ url }: { url: string }) {
  return (
    <div className="relative">
      <div className="flex">
        <MaterialIcon>public</MaterialIcon>
      </div>
      <img
        className="absolute top-0 left-0 h-4 w-4 bg-transparent"
        src={`https://www.google.com/s2/favicons?domain=${url}`}
      />
    </div>
  );
}

function Source({ url }: { url: string }) {
  return (
    <div className="flex items-center space-x-2">
      <FavIcon url={url} />
      <div>{url}</div>
    </div>
  );
}

function PrivacyData({ icon, name, urls }: { icon: string; name: string; urls: string[] }) {
  return (
    <div className="space-y-3 rounded-lg bg-jellyfish p-3">
      <div className="flex flex-row items-center space-x-2 font-bold">
        <MaterialIcon iconSize="xl">{icon}</MaterialIcon>
        <div>{name}</div>
      </div>
      <div className="ml-7 flex flex-col space-y-1.5">
        {urls.map((u, i) => (
          <Source url={u} key={i} />
        ))}
      </div>
    </div>
  );
}

export function Privacy() {
  const { recording } = useGetRecording(getRecordingId());
  const { operations } = recording!;

  return (
    <div className="relative flex h-full w-full overflow-hidden rounded-xl bg-jellyfish p-5 shadow-xl">
      <div className="flex flex-col space-y-7 overflow-hidden">
        <div className="flex flex-col space-y-1">
          <div className="text-lg font-bold">Privacy</div>
          <div className="">
            {`Replays include all of the data needed to replay the browser. `}
            <ExternalLink
              href="https://www.replay.io/security-privacy"
              className="text-primaryAccent underline"
            >
              Learn more
            </ExternalLink>
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
