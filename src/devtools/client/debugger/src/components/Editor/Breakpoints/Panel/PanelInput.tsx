import React from "react";
import {
  EditorWithAutocomplete,
  Keys,
} from "ui/components/shared/CodeEditor/EditorWithAutocomplete";
import { useFeature } from "ui/hooks/settings";

export function PanelInput({
  autofocus,
  value,
  onChange,
  onEnter,
  onEscape,
}: {
  autofocus: boolean;
  value: string;
  onChange: (value: string) => void;
  onEnter: () => void;
  onEscape: () => void;
}) {
  const onKeyPress = (e: KeyboardEvent) => {
    if (e.key === Keys.ENTER && !e.shiftKey) {
      e.preventDefault();
      onEnter();
    } else if (e.key === Keys.ESCAPE) {
      onEscape();
    }
  };

  // Adding a minimum left value here to keep the autocomplete menu from colliding with any of the
  // gutter popups that also rely on createPortal, e.g. LineNumberTooltip, ToggleWidgetButton
  const options = { minLeft: 24, autofocus, isArgument: true };

  return (
    <div className="w-full jsterm-input-container">
      <EditorWithAutocomplete
        onEditorMount={() => {}}
        onPreviewAvailable={() => {}}
        value={value}
        setValue={onChange}
        onRegularKeyPress={onKeyPress}
        opts={options}
      />
    </div>
  );
}
