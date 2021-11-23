import React, { Dispatch, SetStateAction, useState } from "react";
import { UIState } from "ui/state";
import { getAlternateSourceId } from "../../reducers/pause";
import { getSelectedSourceWithContent, getSource } from "../../reducers/sources";
import actions from "../../actions";
import { connect, ConnectedProps } from "react-redux";
import SourcemapError from "./SourcemapError";
import { Source } from "../../reducers/source";

const isNextUrl = (url: string) => url.includes("/_next/");

const isSourcemapped = (selectedSource: Source, alternateSource: Source) =>
  !selectedSource.isOriginal && !!alternateSource;

const shouldHaveSourcemaps = (source: Source, alternateSource: Source) =>
  isNextUrl(source.url) || !!alternateSource;

import { Switch } from "@headlessui/react";
import classNames from "classnames";

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
  showAlternateSource,
}: PropsFromRedux) {
  const [showMapped, setShowMapped] = useState(isSourcemapped(selectedSource, alternateSource));

  const setEnabled = (v: React.SetStateAction<boolean>) => {
    showAlternateSource(selectedSource, alternateSource);
    setShowMapped(v);
  };

  if (!shouldHaveSourcemaps(selectedSource, alternateSource)) {
    return null;
  }

  return (
    <div className="flex items-center pl-3 space-x-1">
      <Toggle enabled={showMapped} setEnabled={setEnabled} disabled={!alternateSource} />
      {!alternateSource ? <SourcemapError /> : <div>Original Source</div>}
    </div>
  );
}

const mapStateToProps = (state: UIState): { selectedSource: Source; alternateSource: Source } => {
  const selectedSource = getSelectedSourceWithContent(state);
  const alternateSourceId = getAlternateSourceId(state, selectedSource);
  const alternateSource = alternateSourceId ? getSource(state, alternateSourceId) : null;

  return {
    selectedSource,
    alternateSource,
  };
};

const connector = connect(mapStateToProps, {
  showAlternateSource: actions.showAlternateSource,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(SourcemapToggle);
