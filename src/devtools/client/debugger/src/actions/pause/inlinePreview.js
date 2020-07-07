/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// @flow
import { sortBy } from "lodash";
import { getFrameScope, getInlinePreviews, getSource } from "../../selectors";
import { features } from "../../utils/prefs";
import { validateThreadContext } from "../../utils/context";
import { hasOriginalNames } from "../../utils/pause/scopes/getScope";
import { loadSourceText } from "../sources/loadSourceText";
import { ThreadFront } from "protocol/thread";

import type { ThreadContext, Frame, Scope, Preview } from "../../types";
import type { ThunkArgs } from "../types";

const { log } = require("protocol/socket");
const { createPrimitiveValueFront } = require("protocol/thread");

// We need to display all variables in the current functional scope so
// include all data for block scopes until the first functional scope
function getLocalScopeLevels(originalAstScopes): number {
  let levels = 0;
  while (originalAstScopes[levels] && originalAstScopes[levels].type === "block") {
    levels++;
  }
  return levels;
}

export function generateInlinePreview(cx: ThreadContext, frameId, location) {
  return async function ({ dispatch, getState, parser, client }: ThunkArgs) {
    if (!features.inlinePreview) {
      return;
    }

    const { thread } = cx;

    // Avoid regenerating inline previews when we already have preview data
    if (getInlinePreviews(getState(), thread, frameId)) {
      return;
    }

    log(`GenerateInlinePreview Start`);

    const frameScopes = getFrameScope(getState(), thread, frameId);

    let scopes: Scope | null = frameScopes && frameScopes.scope;

    if (!scopes || !scopes.bindings) {
      log(`GenerateInlinePreview LoadSourceText NoFrameScopes`);
      return;
    }

    log(`GenerateInlinePreview LoadSourceText Start`);

    const source = getSource(getState(), location.sourceId);
    if (!source) {
      return;
    }
    await dispatch(loadSourceText({ cx, source }));

    log(`GenerateInlinePreview LoadSourceText Done`);

    let originalAstScopes = client.eventMethods.maybeScopes(location);
    if (!originalAstScopes) {
      log(`GenerateInlinePreview FetchingScopes`);
      originalAstScopes = await parser.getScopes(location);
      client.eventMethods.addScopes(location, originalAstScopes);
      validateThreadContext(getState(), cx);
      if (!originalAstScopes) {
        log(`GenerateInlinePreview NoScopes`);
        return;
      }
    }

    log(`GenerateInlinePreview ScopesLoaded`);

    const allPreviews = [];
    const pausedOnLine: number = location.line;
    const levels: number = getLocalScopeLevels(originalAstScopes);
    const useOriginalNames =
      hasOriginalNames(scopes) && ThreadFront.isSourceMappedScript(source.id);

    for (let curLevel = 0; curLevel <= levels && scopes && scopes.bindings; curLevel++) {
      const previewBindings = scopes.bindings.map(async ({ name, originalName, value }) => {
        // As for the scopes pane, when there are original names we only show
        // those in inline previews.
        if (useOriginalNames) {
          if (originalName) {
            name = originalName;
          } else {
            return;
          }
        }

        // We want to show values of properties of objects only and not
        // function calls on other data types like someArr.forEach etc..
        let properties = null;
        if (value.className() === "Object") {
          properties = await client.loadObjectProperties({
            name,
            path: name,
            contents: value,
          });
        }

        const previewsFromBindings: Array<Preview> = getBindingValues(
          originalAstScopes,
          pausedOnLine,
          name,
          value,
          curLevel,
          properties
        );

        allPreviews.push(...previewsFromBindings);
      });

      log(`GenerateInlinePreview PreviewBindings ${curLevel} Start`);

      await Promise.all(previewBindings);

      log(`GenerateInlinePreview PreviewBindings ${curLevel} Done`);

      scopes = scopes.parent;
    }

    const previews = {};
    const sortedPreviews = sortBy(allPreviews, ["line", "column"]);

    sortedPreviews.forEach(preview => {
      const { line } = preview;
      if (!previews[line]) {
        previews[line] = [preview];
      } else {
        previews[line].push(preview);
      }
    });

    return dispatch({
      type: "ADD_INLINE_PREVIEW",
      thread,
      frameId,
      previews,
    });
  };
}

function getBindingValues(
  originalAstScopes: Object,
  pausedOnLine: number,
  name: string,
  value: any,
  curLevel: number,
  properties: Array<Object> | null
): Array<Preview> {
  const previews = [];

  const binding = originalAstScopes[curLevel] && originalAstScopes[curLevel].bindings[name];
  if (!binding) {
    return previews;
  }

  // Show a variable only once ( an object and it's child property are
  // counted as different )
  const identifiers = new Set();

  // We start from end as we want to show values besides variable
  // located nearest to the breakpoint
  for (let i = binding.refs.length - 1; i >= 0; i--) {
    const ref = binding.refs[i];
    // Subtracting 1 from line as codemirror lines are 0 indexed
    const line = ref.start.line - 1;
    const column: number = ref.start.column;
    // We don't want to render inline preview below the paused line
    if (line >= pausedOnLine - 1) {
      continue;
    }

    const info = getExpressionNameAndValue(name, value, ref, properties);
    if (!info) {
      continue;
    }
    const { displayName, displayValue } = info;

    // Variable with same name exists, display value of current or
    // closest to the current scope's variable
    if (identifiers.has(displayName)) {
      continue;
    }
    identifiers.add(displayName);

    previews.push({
      line,
      column,
      name: displayName,
      value: displayValue,
    });
  }
  return previews;
}

function getExpressionNameAndValue(
  name: string,
  value: any,
  // TODO: Add data type to ref
  ref: Object,
  properties: Array<Object> | null
) {
  let displayName = name;
  let displayValue = value;

  // Only variables of type Object will have properties
  if (properties) {
    let { meta } = ref;
    // Presence of meta property means expression contains child property
    // reference eg: objName.propName
    while (meta) {
      // Initially properties will be an array, after that it will be an object
      if (displayValue === value) {
        const property: Object = properties.find(prop => prop.name === meta.property);
        if (!property) {
          // If we don't find the property, it might be on the prototype.
          // Until we're sure we're showing the right thing, don't show
          // anything at all.
          return null;
        }
        displayValue = property ? property.contents : createPrimitiveValueFront(undefined);
        displayName += `.${meta.property}`;
      } else if (displayValue && displayValue.preview && displayValue.preview.ownProperties) {
        const { ownProperties } = displayValue.preview;
        Object.keys(ownProperties).forEach(prop => {
          if (prop === meta.property) {
            displayValue = ownProperties[prop].value;
            displayName += `.${meta.property}`;
          }
        });
      }
      meta = meta.parent;
    }
  }

  return { displayName, displayValue };
}
