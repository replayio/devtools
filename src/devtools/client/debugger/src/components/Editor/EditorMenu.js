/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { showMenu } from "devtools/shared/contextmenu";
import { Component } from "react";

import {
  getPrettySource,
  getIsPaused,
  getThreadContext,
  isSourceWithMap,
  getAlternateSource,
} from "../../selectors";
import { connect } from "../../utils/connect";
import { getSourceLocationFromMouseEvent } from "../../utils/editor";
import { isPretty } from "../../utils/source";

import { editorMenuItems, editorItemActions } from "./menus/editor";

class EditorMenu extends Component {
  UNSAFE_componentWillUpdate(nextProps) {
    this.props.clearContextMenu();
    if (nextProps.contextMenu) {
      this.showMenu(nextProps);
    }
  }

  showMenu(props) {
    const {
      cx,
      editor,
      selectedSource,
      editorActions,
      hasMappedLocation,
      alternateSource,
      isPaused,
      contextMenu: event,
    } = props;

    const location = getSourceLocationFromMouseEvent(
      editor,
      selectedSource,
      // Use a coercion, as contextMenu is optional
      event
    );

    showMenu(
      event,
      editorMenuItems({
        alternateSource,
        cx,
        editorActions,
        hasMappedLocation,
        isPaused,
        isTextSelected: editor.codeMirror.somethingSelected(),
        location,
        selectedSource,
        selectionText: editor.codeMirror.getSelection().trim(),
      })
    );
  }

  render() {
    return null;
  }
}

const mapStateToProps = (state, props) => ({
  alternateSource: getAlternateSource(state),
  cx: getThreadContext(state),
  hasMappedLocation:
    (props.selectedSource.isOriginal ||
      isSourceWithMap(state, props.selectedSource.id) ||
      isPretty(props.selectedSource)) &&
    !getPrettySource(state, props.selectedSource.id),
  isPaused: getIsPaused(state),
});

const mapDispatchToProps = dispatch => ({
  editorActions: editorItemActions(dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(EditorMenu);
