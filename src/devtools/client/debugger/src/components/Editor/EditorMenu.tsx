/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { Component } from "react";
import { connect, ConnectedProps } from "react-redux";
import { showMenu } from "devtools/shared/contextmenu";

import type { UIState } from "ui/state";
import type { AppDispatch } from "ui/setup/store";
import { getThreadContext, getPauseId, getSelectedFrameId } from "../../selectors";
import { SourceDetails } from "ui/reducers/sources";

import { editorMenuItems, editorItemActions } from "./menus/editor";

interface EditorMenuProps {
  selectedSource: SourceDetails;
  clearContextMenu: () => void;
  contextMenu: Event | null;
  editor: any;
}

const mapStateToProps = (state: UIState, props: EditorMenuProps) => ({
  cx: getThreadContext(state),
  pauseId: getPauseId(state),
  selectedFrameId: getSelectedFrameId(state),
  sourcesState: state.sources,
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
    const {
      cx,
      pauseId,
      selectedSource,
      selectedFrameId,
      editorActions,
      sourcesState,
      contextMenu: event,
    } = props;

    showMenu(
      event,
      editorMenuItems({
        cx,
        editorActions,
        pauseId,
        selectedSource,
        selectedFrameId,
        sourcesState,
      })
    );
  }

  render() {
    return null;
  }
}

export default connector(EditorMenu);
