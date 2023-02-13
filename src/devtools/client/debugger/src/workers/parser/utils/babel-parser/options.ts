import type { PluginList } from "./plugin-utils";

// A second optional argument can be given to further configure
// the parser process. These options are recognized:

export type SourceType = "script" | "module" | "unambiguous";

export type Options = {
  sourceType: SourceType;
  sourceFilename?: string;
  startColumn: number;
  startLine: number;
  allowAwaitOutsideFunction: boolean;
  allowReturnOutsideFunction: boolean;
  allowImportExportEverywhere: boolean;
  allowSuperOutsideMethod: boolean;
  allowUndeclaredExports: boolean;
  plugins: PluginList;
  strictMode: boolean | undefined | null;
  ranges: boolean;
  tokens: boolean;
  createParenthesizedExpressions: boolean;
  errorRecovery: boolean;
  attachComment: boolean;
};

export const defaultOptions: Options = {
  // Source type ("script" or "module") for different semantics
  sourceType: "script",
  // Source filename.
  sourceFilename: undefined,
  // Column (0-based) from which to start counting source. Useful for
  // integration with other tools.
  startColumn: 0,
  // Line (1-based) from which to start counting source. Useful for
  // integration with other tools.
  startLine: 1,
  // When enabled, await at the top level is not considered an
  // error.
  allowAwaitOutsideFunction: false,
  // When enabled, a return at the top level is not considered an
  // error.
  allowReturnOutsideFunction: false,
  // When enabled, import/export statements are not constrained to
  // appearing at the top of the program.
  allowImportExportEverywhere: false,
  // TODO
  allowSuperOutsideMethod: false,
  // When enabled, export statements can reference undeclared variables.
  allowUndeclaredExports: false,
  // An array of plugins to enable
  plugins: [],
  // TODO
  strictMode: null,
  // Nodes have their start and end characters offsets recorded in
  // `start` and `end` properties (directly on the node, rather than
  // the `loc` object, which holds line/column data. To also add a
  // [semi-standardized][range] `range` property holding a `[start,
  // end]` array with the same numbers, set the `ranges` option to
  // `true`.
  //
  // [range]: https://bugzilla.mozilla.org/show_bug.cgi?id=745678
  ranges: false,
  // Adds all parsed tokens to a `tokens` property on the `File` node
  tokens: false,
  // Whether to create ParenthesizedExpression AST nodes (if false
  // the parser sets extra.parenthesized on the expression nodes instead).
  createParenthesizedExpressions: false,
  // When enabled, errors are attached to the AST instead of being directly thrown.
  // Some errors will still throw, because @babel/parser can't always recover.
  errorRecovery: false,
  // When enabled, comments will be attached to adjacent AST nodes as one of
  // `leadingComments`, `trailingComments` and `innerComments`. The comment attachment
  // is vital to preserve comments after transform. If you don't print AST back,
  // consider set this option to `false` for performance
  attachComment: true,
};

// Interpret and default an options object

export function getOptions(opts?: Options | null): Options {
  const options: any = {};
  for (const key of Object.keys(defaultOptions)) {
    // @ts-expect-error key may not exist in opts
    options[key] = opts && opts[key] != null ? opts[key] : defaultOptions[key];
  }
  return options;
}
