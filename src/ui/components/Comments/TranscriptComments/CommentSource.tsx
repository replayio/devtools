import React, { useEffect, useState } from "react";
import { ConnectedProps, connect } from "react-redux";

import Icon from "bvaughn-architecture-demo/components/Icon";
import { createSourceLocationLabels } from "bvaughn-architecture-demo/components/sources/utils/createCommentLabels";
import { replayClient } from "shared/client/ReplayClientContext";
import { actions } from "ui/actions";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import { Comment } from "ui/state/comments";
import { trackEvent } from "ui/utils/telemetry";

import LoadingLabelPlaceholder from "./LoadingLabelPlaceholder";
import styles from "./styles.module.css";

type PropsFromParent = {
  comment: Comment;
};
type CommentSourceProps = PropsFromRedux & PropsFromParent;

type State = {
  initialized: boolean;
  primaryLabel: string | null;
  secondaryLabel: string | null;
};

function CommentSource({ comment, context, selectLocation, setViewMode }: CommentSourceProps) {
  const { primaryLabel, secondaryLabel, sourceLocation } = comment;

  // If the comment has no labels, lazily create them.
  const [state, setState] = useState<State>({
    initialized: secondaryLabel !== null || primaryLabel !== null,
    primaryLabel: primaryLabel ?? null,
    secondaryLabel: secondaryLabel ?? null,
  });

  useEffect(() => {
    if (state.initialized) {
      return;
    } else if (primaryLabel !== null || secondaryLabel !== null) {
      return;
    } else if (sourceLocation === null) {
      return;
    }

    const loadLabels = async () => {
      try {
        const { primaryLabel, secondaryLabel } = await createSourceLocationLabels(
          replayClient,
          sourceLocation.sourceId,
          sourceLocation.line,
          sourceLocation.column
        );

        setState({
          initialized: true,
          primaryLabel,
          secondaryLabel,
        });
      } catch (error) {
        console.error(error);

        setState({
          initialized: true,
          primaryLabel: null,
          secondaryLabel: null,
        });
      }
    };

    loadLabels();
  }, [primaryLabel, secondaryLabel, sourceLocation, state]);

  if (!sourceLocation) {
    return null;
  }

  const onSelectSource = () => {
    setViewMode("dev");
    trackEvent("comments.select_location");
    selectLocation(context, sourceLocation);
  };

  return (
    <div className={styles.LabelGroup} onClick={onSelectSource} title="Show in the Editor">
      <div className={styles.Labels}>
        {state.initialized ? (
          <>
            {state.primaryLabel && <div className={styles.PrimaryLabel}>{state.primaryLabel}</div>}
            {state.secondaryLabel && (
              <pre
                className={styles.SecondaryLabel}
                dangerouslySetInnerHTML={{ __html: state.secondaryLabel }}
              />
            )}
          </>
        ) : (
          <LoadingLabelPlaceholder />
        )}
      </div>
      <Icon className={styles.Icon} type="chevron-right" />
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    context: selectors.getThreadContext(state),
  }),
  {
    selectLocation: actions.selectLocation,
    setViewMode: actions.setViewMode,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(CommentSource);
