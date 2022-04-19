/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import * as t from "@babel/types";

import { traverseAst } from "./utils/ast";
import getFunctionName from "./utils/getFunctionName";
import { isFunction, getCode, getFunctionParameterNames } from "./utils/helpers";
import { inferClassName } from "./utils/inferClassName";
import createSimplePath from "./utils/simple-path";

let symbolDeclarations = new Map();

// eslint-disable-next-line complexity
function extractSymbol(path, symbols, state) {
  if (isFunction(path)) {
    const name = getFunctionName(path.node, path.parent);

    if (!state.fnCounts[name]) {
      state.fnCounts[name] = 0;
    }
    const index = state.fnCounts[name]++;

    symbols.functions.push({
      identifier: path.node.id,
      // indicates the occurence of the function in a file
      // e.g { name: foo, ... index: 4 } is the 4th foo function
      // in the file
      index,

      klass: inferClassName(path),

      location: path.node.loc,

      name,

      parameterNames: getFunctionParameterNames(path),
    });
  }

  if (t.isCallExpression(path)) {
    const name = path.node?.callee?.name;
    if (name === "__d") {
      const moduleName = path.node.arguments[0]?.value;
      const loc = path.node.arguments[2]?.loc;
      const location = {
        end: loc.end,
        start: { column: 0, line: loc.start.line + 1 },
      };
      symbols.functions.push({
        location,
        name: moduleName,
      });
    }
  }

  if (t.isJSXElement(path)) {
    symbols.hasJsx = true;
  }

  if (t.isGenericTypeAnnotation(path)) {
    symbols.hasTypes = true;
  }

  if (t.isClassDeclaration(path)) {
    const { loc, superClass } = path.node;
    symbols.classes.push({
      location: loc,
      name: path.node.id.name,
      parent: superClass
        ? {
            location: superClass.loc,
            name: t.isMemberExpression(superClass) ? getCode(superClass) : superClass.name,
          }
        : null,
    });
  }
}

function extractSymbols(sourceId) {
  const symbols = {
    classes: [],
    functions: [],
    hasJsx: false,
    hasTypes: false,
    loading: false,
  };

  const state = {
    fnCounts: Object.create(null),
  };

  traverseAst(sourceId, {
    enter(node, ancestors) {
      try {
        const path = createSimplePath(ancestors);
        if (path) {
          extractSymbol(path, symbols, state);
        }
      } catch (e) {
        console.error(e);
      }
    },
  });

  return symbols;
}

export function clearSymbols() {
  symbolDeclarations = new Map();
}

export function getSymbols(sourceId) {
  if (symbolDeclarations.has(sourceId)) {
    const symbols = symbolDeclarations.get(sourceId);
    if (symbols) {
      return symbols;
    }
  }

  const symbols = extractSymbols(sourceId);

  symbolDeclarations.set(sourceId, symbols);
  return symbols;
}
