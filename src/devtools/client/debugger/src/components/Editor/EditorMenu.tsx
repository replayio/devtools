/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { Component } from "react";
import { connect, ConnectedProps } from "react-redux";
import { showMenu } from "devtools/shared/contextmenu";

import type { UIState } from "ui/state";
import type { AppDispatch } from "ui/setup/store";
import type { Source, SourceWithContent } from "devtools/client/debugger/src/reducers/sources";
import { isPretty } from "../../utils/source";
import {
  getPrettySource,
  getIsPaused,
  getThreadContext,
  isSourceWithMap,
  getAlternateSource,
} from "../../selectors";

import { editorMenuItems, editorItemActions } from "./menus/editor";

interface EditorMenuProps {
  selectedSource: SourceWithContent;
  clearContextMenu: () => void;
  contextMenu?: () => void;
  editor: any;
}

const mapStateToProps = (state: UIState, props: EditorMenuProps) => ({
  cx: getThreadContext(state),
  isPaused: getIsPaused(state),
  alternateSource: getAlternateSource(state),
  hasMappedLocation:
    (props.selectedSource.isOriginal ||
      isSourceWithMap(state, props.selectedSource.id) ||
      isPretty(props.selectedSource)) &&
    !getPrettySource(state, props.selectedSource.id),
});

const connector = connect(mapStateToProps, dispatch => ({
  editorActions: editorItemActions(dispatch as AppDispatch),
}));

type PropsFromRedux = ConnectedProps<typeof connector>;
type FinalEMProps = EditorMenuProps & PropsFromRedux;

class EditorMenu extends Component<FinalEMProps> {
  UNSAFE_componentWillUpdate(nextProps: FinalEMProps) {
    this.props.clearContextMenu();
    if (nextProps.contextMenu) {
      this.showMenu(nextProps);
    }
  }

  showMenu(props: FinalEMProps) {
    const { cx, selectedSource, editorActions, alternateSource, contextMenu: event } = props;

    showMenu(
      event,
      editorMenuItems({
        cx,
        editorActions,
        // @ts-expect-error Source/SourceWithContent mismatch  but will be changed shortly
        selectedSource,
        alternateSource,
      })
    );
  }

  render() {
    return null;
  }
}

export default connector(EditorMenu);
