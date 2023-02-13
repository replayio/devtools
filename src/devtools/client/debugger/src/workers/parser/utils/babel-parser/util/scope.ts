import {
  SCOPE_ARROW,
  SCOPE_DIRECT_SUPER,
  SCOPE_FUNCTION,
  SCOPE_SIMPLE_CATCH,
  SCOPE_SUPER,
  SCOPE_PROGRAM,
  SCOPE_VAR,
  SCOPE_CLASS,
  SCOPE_STATIC_BLOCK,
  BIND_SCOPE_FUNCTION,
  BIND_SCOPE_VAR,
  BIND_SCOPE_LEXICAL,
  BIND_KIND_VALUE,
  type ScopeFlags,
  type BindingTypes,
} from "./scopeflags";
import type { Position } from "./location";
import type * as N from "../types";
import { Errors } from "../parse-error";
import type Tokenizer from "../tokenizer";

// Start an AST node, attaching a start offset.
export class Scope {
  declare flags: ScopeFlags;
  // A set of var-declared names in the current lexical scope
  var: Set<string> = new Set();
  // A set of lexically-declared names in the current lexical scope
  lexical: Set<string> = new Set();
  // A set of lexically-declared FunctionDeclaration names in the current lexical scope
  functions: Set<string> = new Set();

  constructor(flags: ScopeFlags) {
    this.flags = flags;
  }
}

// The functions in this module keep track of declared variables in the
// current scope in order to detect duplicate variable names.
export default class ScopeHandler<IScope extends Scope = Scope> {
  parser: Tokenizer;
  scopeStack: Array<IScope> = [];
  inModule: boolean;
  undefinedExports: Map<string, Position> = new Map();

  constructor(parser: Tokenizer, inModule: boolean) {
    this.parser = parser;
    this.inModule = inModule;
  }

  get inTopLevel() {
    return (this.currentScope().flags & SCOPE_PROGRAM) > 0;
  }
  get inFunction() {
    return (this.currentVarScopeFlags() & SCOPE_FUNCTION) > 0;
  }
  get allowSuper() {
    return (this.currentThisScopeFlags() & SCOPE_SUPER) > 0;
  }
  get allowDirectSuper() {
    return (this.currentThisScopeFlags() & SCOPE_DIRECT_SUPER) > 0;
  }
  get inClass() {
    return (this.currentThisScopeFlags() & SCOPE_CLASS) > 0;
  }
  get inClassAndNotInNonArrowFunction() {
    const flags = this.currentThisScopeFlags();
    return (flags & SCOPE_CLASS) > 0 && (flags & SCOPE_FUNCTION) === 0;
  }
  get inStaticBlock() {
    for (let i = this.scopeStack.length - 1; ; i--) {
      const { flags } = this.scopeStack[i];
      if (flags & SCOPE_STATIC_BLOCK) {
        return true;
      }
      if (flags & (SCOPE_VAR | SCOPE_CLASS)) {
        // function body, module body, class property initializers
        return false;
      }
    }
  }
  get inNonArrowFunction() {
    return (this.currentThisScopeFlags() & SCOPE_FUNCTION) > 0;
  }
  get treatFunctionsAsVar() {
    return this.treatFunctionsAsVarInScope(this.currentScope());
  }

  createScope(flags: ScopeFlags): Scope {
    return new Scope(flags);
  }

  enter(flags: ScopeFlags) {
    /*:: +createScope: (flags: ScopeFlags) => IScope; */
    // @ts-expect-error This method will be overwritten by subclasses
    this.scopeStack.push(this.createScope(flags));
  }

  exit(): ScopeFlags {
    const scope = this.scopeStack.pop();
    return scope.flags;
  }

  // The spec says:
  // > At the top level of a function, or script, function declarations are
  // > treated like var declarations rather than like lexical declarations.
  treatFunctionsAsVarInScope(scope: IScope): boolean {
    return !!(
      scope.flags & (SCOPE_FUNCTION | SCOPE_STATIC_BLOCK) ||
      (!this.parser.inModule && scope.flags & SCOPE_PROGRAM)
    );
  }

  declareName(name: string, bindingType: BindingTypes, loc: Position) {
    let scope = this.currentScope();
    if (bindingType & BIND_SCOPE_LEXICAL || bindingType & BIND_SCOPE_FUNCTION) {
      this.checkRedeclarationInScope(scope, name, bindingType, loc);

      if (bindingType & BIND_SCOPE_FUNCTION) {
        scope.functions.add(name);
      } else {
        scope.lexical.add(name);
      }

      if (bindingType & BIND_SCOPE_LEXICAL) {
        this.maybeExportDefined(scope, name);
      }
    } else if (bindingType & BIND_SCOPE_VAR) {
      for (let i = this.scopeStack.length - 1; i >= 0; --i) {
        scope = this.scopeStack[i];
        this.checkRedeclarationInScope(scope, name, bindingType, loc);
        scope.var.add(name);
        this.maybeExportDefined(scope, name);

        if (scope.flags & SCOPE_VAR) break;
      }
    }
    if (this.parser.inModule && scope.flags & SCOPE_PROGRAM) {
      this.undefinedExports.delete(name);
    }
  }

  maybeExportDefined(scope: IScope, name: string) {
    if (this.parser.inModule && scope.flags & SCOPE_PROGRAM) {
      this.undefinedExports.delete(name);
    }
  }

  checkRedeclarationInScope(
    scope: IScope,
    name: string,
    bindingType: BindingTypes,
    loc: Position,
  ) {
    if (this.isRedeclaredInScope(scope, name, bindingType)) {
      this.parser.raise(Errors.VarRedeclaration, {
        at: loc,
        identifierName: name,
      });
    }
  }

  isRedeclaredInScope(
    scope: IScope,
    name: string,
    bindingType: BindingTypes,
  ): boolean {
    if (!(bindingType & BIND_KIND_VALUE)) return false;

    if (bindingType & BIND_SCOPE_LEXICAL) {
      return (
        scope.lexical.has(name) ||
        scope.functions.has(name) ||
        scope.var.has(name)
      );
    }

    if (bindingType & BIND_SCOPE_FUNCTION) {
      return (
        scope.lexical.has(name) ||
        (!this.treatFunctionsAsVarInScope(scope) && scope.var.has(name))
      );
    }

    return (
      (scope.lexical.has(name) &&
        !(
          scope.flags & SCOPE_SIMPLE_CATCH &&
          scope.lexical.values().next().value === name
        )) ||
      (!this.treatFunctionsAsVarInScope(scope) && scope.functions.has(name))
    );
  }

  checkLocalExport(id: N.Identifier) {
    const { name } = id;
    const topLevelScope = this.scopeStack[0];
    if (
      !topLevelScope.lexical.has(name) &&
      !topLevelScope.var.has(name) &&
      // In strict mode, scope.functions will always be empty.
      // Modules are strict by default, but the `scriptMode` option
      // can overwrite this behavior.
      !topLevelScope.functions.has(name)
    ) {
      this.undefinedExports.set(name, id.loc.start);
    }
  }

  currentScope(): IScope {
    return this.scopeStack[this.scopeStack.length - 1];
  }

  currentVarScopeFlags(): ScopeFlags {
    for (let i = this.scopeStack.length - 1; ; i--) {
      const { flags } = this.scopeStack[i];
      if (flags & SCOPE_VAR) {
        return flags;
      }
    }
  }

  // Could be useful for `arguments`, `this`, `new.target`, `super()`, `super.property`, and `super[property]`.
  currentThisScopeFlags(): ScopeFlags {
    for (let i = this.scopeStack.length - 1; ; i--) {
      const { flags } = this.scopeStack[i];
      if (flags & (SCOPE_VAR | SCOPE_CLASS) && !(flags & SCOPE_ARROW)) {
        return flags;
      }
    }
  }
}
