/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { $canShowPlaceholderCurry } from "@lexical/text";
import { mergeRegister } from "@lexical/utils";
import type { LexicalEditor } from "lexical";
import { useLayoutEffect, useState } from "react";

function canShowPlaceholderFromCurrentEditorState(editor: LexicalEditor): boolean {
  const currentCanShowPlaceholder = editor
    .getEditorState()
    .read($canShowPlaceholderCurry(editor.isComposing(), editor.isEditable()));

  return currentCanShowPlaceholder;
}

export default function useCanShowPlaceholder(editor: LexicalEditor): boolean {
  const [canShowPlaceholder, setCanShowPlaceholder] = useState(() =>
    canShowPlaceholderFromCurrentEditorState(editor)
  );

  useLayoutEffect(() => {
    function resetCanShowPlaceholder() {
      const currentCanShowPlaceholder = canShowPlaceholderFromCurrentEditorState(editor);
      setCanShowPlaceholder(currentCanShowPlaceholder);
    }
    resetCanShowPlaceholder();
    return mergeRegister(
      editor.registerUpdateListener(() => {
        resetCanShowPlaceholder();
      }),
      editor.registerEditableListener(() => {
        resetCanShowPlaceholder();
      })
    );
  }, [editor]);

  return canShowPlaceholder;
}
