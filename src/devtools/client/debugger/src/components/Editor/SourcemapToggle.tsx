import React, { Dispatch, SetStateAction } from "react";
import { UIState } from "ui/state";
import { getAlternateSource } from "../../reducers/pause";
import { getSelectedSourceWithContent, Source } from "../../reducers/sources";
import actions from "../../actions";
import { connect, ConnectedProps } from "react-redux";

import { Switch } from "@headlessui/react";
import classNames from "classnames";
import { setModal } from "ui/actions/app";
import { ThreadFront } from "protocol/thread";
import { SourceId } from "@recordreplay/protocol";
import { getUniqueAlternateSourceId } from "../../utils/source";

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
          enabled ? "bg-primaryAccent" : "bg-themeToggleBgcolor",
          "relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primaryAccent focus:ring-offset-2"
        )}
      >
        <span
          aria-hidden="true"
          className={classNames(
            enabled ? "translate-x-3" : "translate-x-0",
            "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
          )}
        />
      </Switch>
    </div>
  );
}

export function SourcemapToggle({
  selectedSource,
  alternateSource,
  setModal,
  showAlternateSource,
}: PropsFromRedux) {
  let alternateSourceId: SourceId | undefined;
  if (alternateSource) {
    alternateSourceId = alternateSource.id;
  } else {
    const result = getUniqueAlternateSourceId(selectedSource.id);
    alternateSourceId = result.sourceId;
    if (!alternateSourceId && result.why === "not-unique") {
      return null;
    }
  }

  const setEnabled = (v: React.SetStateAction<boolean>) => {
    showAlternateSource(selectedSource.id, alternateSourceId);
  };
  const onErrorClick = () => {
    setModal("sourcemap-setup");
  };

  return (
    <div className="mapped-source flex items-center space-x-1 pl-3">
      <Toggle
        enabled={selectedSource.isOriginal}
        setEnabled={setEnabled}
        disabled={!alternateSourceId}
      />
      {!alternateSourceId ? <SourcemapError onClick={onErrorClick} /> : <div>Original Source</div>}
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    selectedSource: getSelectedSourceWithContent(state),
    alternateSource: getAlternateSource(state),
  }),
  {
    showAlternateSource: actions.showAlternateSource,
    setModal,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(SourcemapToggle);
