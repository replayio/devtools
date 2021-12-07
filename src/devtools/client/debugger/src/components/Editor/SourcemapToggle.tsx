import React, { Dispatch, SetStateAction, useState } from "react";
import { UIState } from "ui/state";
import { getAlternateSource } from "../../reducers/pause";
import {
  getIsSourceMappedSource,
  getSelectedSourceWithContent,
  Source,
} from "../../reducers/sources";
import actions from "../../actions";
import { connect, ConnectedProps } from "react-redux";

const isNextUrl = (url: string) => url.includes("/_next/");
const shouldHaveSourcemaps = (source: Source, alternateSource: Source | null) =>
  isNextUrl(source.url) || !!alternateSource;

import { Switch } from "@headlessui/react";
import classNames from "classnames";
import { setModal } from "ui/actions/app";

function SourcemapError({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex items-center space-x-1" onClick={onClick}>
      <span>No sourcemaps found.</span>
      <button className="underline">Learn more</button>
    </div>
  );
}

export function Toggle({
  enabled,
  setEnabled,
  disabled,
}: {
  enabled: boolean;
  setEnabled: Dispatch<SetStateAction<boolean>>;
  disabled?: boolean;
}) {
  const onChange = (value: boolean) => {
    if (disabled) {
      return;
    }

    setEnabled(value);
  };

  return (
    <div className={classNames({ "pointer-events-none": disabled })}>
      <Switch
        checked={enabled}
        onChange={onChange}
        className={classNames(
          enabled ? "bg-primaryAccent" : "bg-gray-200",
          "relative inline-flex flex-shrink-0 h-4 w-7 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent"
        )}
      >
        <span
          aria-hidden="true"
          className={classNames(
            enabled ? "translate-x-3" : "translate-x-0",
            "pointer-events-none inline-block h-3 w-3 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200"
          )}
        />
      </Switch>
    </div>
  );
}

export function SourcemapToggle({
  selectedSource,
  alternateSource,
  isSourceMappedSource,
  setModal,
  showAlternateSource,
}: PropsFromRedux) {
  if (!shouldHaveSourcemaps(selectedSource, alternateSource)) {
    return null;
  }

  const setEnabled = (v: React.SetStateAction<boolean>) => {
    showAlternateSource(selectedSource, alternateSource);
  };
  const onErrorClick = () => {
    setModal("sourcemap-setup");
  };

  return (
    <div className="flex items-center pl-3 space-x-1">
      <Toggle enabled={isSourceMappedSource} setEnabled={setEnabled} disabled={!alternateSource} />
      {!alternateSource ? <SourcemapError onClick={onErrorClick} /> : <div>Original Source</div>}
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    selectedSource: getSelectedSourceWithContent(state),
    alternateSource: getAlternateSource(state),
    isSourceMappedSource: getIsSourceMappedSource(state),
  }),
  {
    showAlternateSource: actions.showAlternateSource,
    setModal,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(SourcemapToggle);
