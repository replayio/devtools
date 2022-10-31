import classnames from "classnames";
import { closeTab } from "devtools/client/debugger/src/actions/tabs";
import { getActiveSearch, getThreadContext } from "devtools/client/debugger/src/selectors";
import { getDocument } from "devtools/client/debugger/src/utils/editor";
import type { SourceEditor } from "devtools/client/debugger/src/utils/editor/source-editor";
import { RefObject, useEffect, useMemo, useRef, useState } from "react";
import { ContextMenu, closeContextMenu } from "ui/actions/contextMenus";
import GutterContextMenu from "ui/components/ContextMenu/GutterContextMenu";
import { KeyModifiersContext } from "ui/components/KeyModifiers";
import KeyShortcuts from "devtools/client/shared/key-shortcuts";
import { EditorNag, NAG_HEIGHT } from "ui/components/shared/Nags/Nags";
import { getContextMenu } from "ui/reducers/contextMenus";
import { getSelectedSource, SourceDetails } from "ui/reducers/sources";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import ColumnBreakpoints from "./ColumnBreakpoints";
import DebugLine from "./DebugLine";
import EditorLoadingBar from "./EditorLoadingBar";
import EditorMenu from "./EditorMenu";
import EmptyLines from "./EmptyLines";
import LineNumberTooltip from "./LineNumberTooltip";
import Preview from "./Preview";
import SearchBar from "./SearchBar";
import ShortcutsContext from "./ShortcutsContext";
import ToggleWidgetButton from "./ToggleWidgetButton";
import useEditor from "./useEditor";

const SEARCH_BAR_HEIGHT_CSS_VAR = "var(--editor-searchbar-height)";

export default function EditorOuter() {
  const dispatch = useAppDispatch();

  const cx = useAppSelector(getThreadContext);
  const gutterContextMenu = useAppSelector(getContextMenu);
  const searchOn = useAppSelector(getActiveSearch) === "file";
  const selectedSource = useAppSelector(getSelectedSource) || null;

  const [contextMenu, setContextMenu] = useState<MouseEvent | null>(null);

  const shortcuts = useMemo(() => new KeyShortcuts({ window, target: document }), []);

  const containerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor(containerRef, setContextMenu);

  // Register shortcuts event handlers
  useEffect(() => {
    if (editor == null || !selectedSource) {
      return;
    }

    const onClosePress = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      dispatch(closeTab(cx, selectedSource));
    };

    // The default Esc command is overridden in the CodeMirror key-map
    // to allow the Esc keypress event to be caught by the toolbox
    // and trigger the split console.
    // Restore it here, but preventDefault if and only if there is a multi-selection.
    const onEscape = (event: KeyboardEvent) => {
      const { codeMirror } = editor;
      if (codeMirror.listSelections().length > 1) {
        event.preventDefault();

        codeMirror.execCommand("singleSelection");
      }
    };

    shortcuts.on("CmdOrCtrl+W", onClosePress);
    shortcuts.on("Esc", onEscape);

    return () => {
      shortcuts.off("CmdOrCtrl+W", onClosePress);
      shortcuts.off("Esc", onEscape);
    };
  }, [cx, dispatch, editor, selectedSource, shortcuts]);

  return (
    <ShortcutsContext.Provider value={shortcuts}>
      <div
        className={classnames("editor-wrapper", {
          showLineHits: true,
        })}
        ref={containerRef}
      >
        <EditorNag />
        <div
          className="editor-mount devtools-monospace"
          style={{
            height: `calc(100% - ${searchOn ? SEARCH_BAR_HEIGHT_CSS_VAR : "0px"} - ${
              containerRef.current?.querySelector(".nag-hat") ? NAG_HEIGHT : "0px"
            })`,
          }}
        />
        {selectedSource ? <SearchBar editor={editor} /> : null}
        <EditorInner
          containerRef={containerRef}
          contextMenu={contextMenu}
          editor={editor}
          gutterContextMenu={gutterContextMenu}
          selectedSource={selectedSource}
          setContextMenu={setContextMenu}
        />
      </div>
    </ShortcutsContext.Provider>
  );
}

function EditorInner({
  containerRef,
  contextMenu,
  editor,
  gutterContextMenu,
  selectedSource,
  setContextMenu,
}: {
  containerRef: RefObject<HTMLDivElement>;
  contextMenu: MouseEvent | null;
  editor: SourceEditor | null;
  gutterContextMenu: ContextMenu | null;
  selectedSource: SourceDetails | null;
  setContextMenu: (event: MouseEvent | null) => void;
}) {
  const dispatch = useAppDispatch();

  if (!selectedSource || !editor) {
    return null;
  }

  if (!getDocument(selectedSource.id)) {
    return <EditorLoadingBar />;
  }

  return (
    <div>
      {gutterContextMenu && (
        <GutterContextMenu
          contextMenu={gutterContextMenu}
          close={() => dispatch(closeContextMenu)}
        />
      )}
      <DebugLine />
      <EmptyLines editor={editor} />
      <Preview containerRef={containerRef} editor={editor} />
      <KeyModifiersContext.Consumer>
        {keyModifiers => <LineNumberTooltip keyModifiers={keyModifiers} />}
      </KeyModifiersContext.Consumer>
      <EditorMenu
        clearContextMenu={() => setContextMenu(null)}
        contextMenu={contextMenu}
        editor={editor}
        selectedSource={selectedSource}
      />
      <ColumnBreakpoints editor={editor} />
      <ToggleWidgetButton />
    </div>
  );
}
