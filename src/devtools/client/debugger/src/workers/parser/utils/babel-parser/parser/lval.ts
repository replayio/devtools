import * as charCodes from "charcodes";

import { Errors, LValAncestor } from "../parse-error";
import { TokenType, tt } from "../tokenizer/types";
import type {
  ArrayExpression,
  ArrayPattern,
  AssignmentPattern,
  ClassMember,
  Decorator,
  Expression,
  Identifier,
  Node,
  ObjectExpression,
  ObjectMember,
  ObjectOrClassMember,
  ObjectPattern,
  Pattern,
  PrivateName,
  RestElement,
  SpreadElement,
  TSParameterProperty,
  TsNamedTypeElementBase,
} from "../types";
import { isStrictBindOnlyReservedWord, isStrictBindReservedWord } from "../util/identifier";
import type { Pos, Position } from "../util/location";
import { BIND_FLAGS_NO_LET_IN_LEXICAL, BIND_NONE, BindingTypes } from "../util/scopeflags";
import type Parser from "./index";
import { NodeUtils, Undone } from "./node";
import type { ExpressionErrors } from "./util";

const getOwn = <T extends {}>(object: T, key: keyof T) =>
  Object.hasOwnProperty.call(object, key) && object[key];

const unwrapParenthesizedExpression = (node: Node): Node => {
  return node.type === "ParenthesizedExpression"
    ? unwrapParenthesizedExpression(node.expression)
    : node;
};

export enum ParseBindingListFlags {
  ALLOW_EMPTY = 1 << 0,
  IS_FUNCTION_PARAMS = 1 << 1,
  IS_CONSTRUCTOR_PARAMS = 1 << 2,
}

export default abstract class LValParser extends NodeUtils {
  // Forward-declaration: defined in expression.js
  abstract parseIdentifier(liberal?: boolean): Identifier;
  abstract parseMaybeAssign(
    refExpressionErrors?: ExpressionErrors | null,
    afterLeftParse?: Function,
    refNeedsArrowPos?: Pos | null
  ): Expression;

  abstract parseMaybeAssignAllowIn(
    refExpressionErrors?: ExpressionErrors | null,
    afterLeftParse?: Function,
    refNeedsArrowPos?: Pos | null
  ): Expression;

  abstract parseObjectLike<T extends ObjectPattern | ObjectExpression>(
    close: TokenType,
    isPattern: boolean,
    isRecord?: boolean,
    refExpressionErrors?: ExpressionErrors
  ): T;
  abstract parseObjPropValue(
    prop: any,
    startLoc: Position | null,
    isGenerator: boolean,
    isAsync: boolean,
    isPattern: boolean,
    isAccessor: boolean,
    refExpressionErrors?: ExpressionErrors | null
  ): void;
  abstract parsePropertyName(
    prop: ObjectOrClassMember | ClassMember | TsNamedTypeElementBase
  ): Expression | Identifier;
  abstract parsePrivateName(): PrivateName;
  // Forward-declaration: defined in statement.js
  abstract parseDecorator(): Decorator;

  /**
   * Convert existing expression atom to assignable pattern
   * if possible. Also checks invalid destructuring targets:
   *
   * - Parenthesized Destructuring patterns
   * - RestElement is not the last element
   * - Missing `=` in assignment pattern
   *
   * NOTE: There is a corresponding "isAssignable" method.
   * When this one is updated, please check if also that one needs to be updated.
   *
   * @param node The expression atom
   * @param isLHS Whether we are parsing a LeftHandSideExpression.
   *              If isLHS is `true`, the following cases are allowed: `[(a)] = [0]`, `[(a.b)] = [0]`
   *              If isLHS is `false`, we are in an arrow function parameters list.
   */
  toAssignable(node: Node, isLHS: boolean = false): void {
    let parenthesized = undefined;
    if (node.type === "ParenthesizedExpression" || node.extra?.parenthesized) {
      parenthesized = unwrapParenthesizedExpression(node);
      if (isLHS) {
        // an LHS can be reinterpreted to a binding pattern but not vice versa.
        // therefore a parenthesized identifier is ambiguous until we are sure it is an assignment expression
        // i.e. `([(a) = []] = []) => {}`
        // see also `recordArrowParemeterBindingError` signature in packages/babel-parser/src/util/expression-scope.js
        if (parenthesized.type === "Identifier") {
          this.expressionScope.recordArrowParameterBindingError(
            Errors.InvalidParenthesizedAssignment,
            { at: node }
          );
        } else if (parenthesized.type !== "MemberExpression") {
          // A parenthesized member expression can be in LHS but not in pattern.
          // If the LHS is later interpreted as a pattern, `checkLVal` will throw for member expression binding
          // i.e. `([(a.b) = []] = []) => {}`
          this.raise(Errors.InvalidParenthesizedAssignment, { at: node });
        }
      } else {
        this.raise(Errors.InvalidParenthesizedAssignment, { at: node });
      }
    }

    switch (node.type) {
      case "Identifier":
      case "ObjectPattern":
      case "ArrayPattern":
      case "AssignmentPattern":
      case "RestElement":
        break;

      case "ObjectExpression":
        node.type = "ObjectPattern";
        for (let i = 0, length = node.properties.length, last = length - 1; i < length; i++) {
          const prop = node.properties[i];
          const isLast = i === last;
          this.toAssignableObjectExpressionProp(prop, isLast, isLHS);

          if (isLast && prop.type === "RestElement" && node.extra?.trailingCommaLoc) {
            this.raise(Errors.RestTrailingComma, {
              at: node.extra.trailingCommaLoc,
            });
          }
        }
        break;

      case "ObjectProperty": {
        const { key, value } = node;
        if (this.isPrivateName(key)) {
          this.classScope.usePrivateName(this.getPrivateNameSV(key), key.loc.start);
        }
        this.toAssignable(value, isLHS);
        break;
      }

      case "SpreadElement": {
        throw new Error(
          "Internal @babel/parser error (this is a bug, please report it)." +
            " SpreadElement should be converted by .toAssignable's caller."
        );
      }

      case "ArrayExpression":
        node.type = "ArrayPattern";
        this.toAssignableList(node.elements, node.extra?.trailingCommaLoc, isLHS);
        break;

      case "AssignmentExpression":
        if (node.operator !== "=") {
          this.raise(Errors.MissingEqInAssignment, { at: node.left.loc.end });
        }

        node.type = "AssignmentPattern";
        delete node.operator;
        this.toAssignable(node.left, isLHS);
        break;

      case "ParenthesizedExpression":
        /*::invariant (parenthesized !== undefined) */
        // @ts-expect-error
        this.toAssignable(parenthesized, isLHS);
        break;

      default:
      // We don't know how to deal with this node. It will
      // be reported by a later call to checkLVal
    }
  }

  toAssignableObjectExpressionProp(prop: Node, isLast: boolean, isLHS: boolean) {
    if (prop.type === "ObjectMethod") {
      this.raise(
        prop.kind === "get" || prop.kind === "set"
          ? Errors.PatternHasAccessor
          : Errors.PatternHasMethod,
        { at: prop.key }
      );
    } else if (prop.type === "SpreadElement") {
      prop.type = "RestElement";
      const arg = prop.argument;
      this.checkToRestConversion(arg, /* allowPattern */ false);
      this.toAssignable(arg, isLHS);

      if (!isLast) {
        this.raise(Errors.RestTrailingComma, { at: prop });
      }
    } else {
      this.toAssignable(prop, isLHS);
    }
  }

  // Convert list of expression atoms to binding list.

  toAssignableList(
    exprList: Expression[],
    trailingCommaLoc: Position | undefined | null,
    isLHS: boolean
  ): void {
    const end = exprList.length - 1;

    for (let i = 0; i <= end; i++) {
      const elt = exprList[i];
      if (!elt) continue;

      if (elt.type === "SpreadElement") {
        elt.type = "RestElement";
        const arg = elt.argument;
        this.checkToRestConversion(arg, /* allowPattern */ true);
        this.toAssignable(arg, isLHS);
      } else {
        this.toAssignable(elt, isLHS);
      }

      if (elt.type === "RestElement") {
        if (i < end) {
          this.raise(Errors.RestTrailingComma, { at: elt });
        } else if (trailingCommaLoc) {
          this.raise(Errors.RestTrailingComma, { at: trailingCommaLoc });
        }
      }
    }
  }

  isAssignable(node: Node, isBinding?: boolean): boolean {
    switch (node.type) {
      case "Identifier":
      case "ObjectPattern":
      case "ArrayPattern":
      case "AssignmentPattern":
      case "RestElement":
        return true;

      case "ObjectExpression": {
        const last = node.properties.length - 1;
        return (node.properties as ObjectExpression["properties"]).every((prop, i) => {
          return (
            prop.type !== "ObjectMethod" &&
            (i === last || prop.type !== "SpreadElement") &&
            this.isAssignable(prop)
          );
        });
      }

      case "ObjectProperty":
        return this.isAssignable(node.value);

      case "SpreadElement":
        return this.isAssignable(node.argument);

      case "ArrayExpression":
        return (node as ArrayExpression).elements.every(
          // @ts-expect-error
          element => element === null || this.isAssignable(element)
        );

      case "AssignmentExpression":
        return node.operator === "=";

      case "ParenthesizedExpression":
        return this.isAssignable(node.expression);

      case "MemberExpression":
      case "OptionalMemberExpression":
        return !isBinding;

      default:
        return false;
    }
  }

  // Convert list of expression atoms to a list of

  toReferencedList(
    exprList: ReadonlyArray<Expression | undefined | null>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isParenthesizedExpr?: boolean
  ): ReadonlyArray<Expression | undefined | null> {
    return exprList;
  }

  toReferencedListDeep(
    exprList: ReadonlyArray<Expression | undefined | null>,
    isParenthesizedExpr?: boolean
  ): void {
    this.toReferencedList(exprList, isParenthesizedExpr);

    for (const expr of exprList) {
      if (expr?.type === "ArrayExpression") {
        this.toReferencedListDeep(expr.elements);
      }
    }
  }

  // Parses spread element.

  parseSpread(this: Parser, refExpressionErrors?: ExpressionErrors | null): SpreadElement {
    const node = this.startNode<SpreadElement>();
    this.next();
    node.argument = this.parseMaybeAssignAllowIn(refExpressionErrors, undefined);
    return this.finishNode(node, "SpreadElement");
  }

  // https://tc39.es/ecma262/#prod-BindingRestProperty
  // https://tc39.es/ecma262/#prod-BindingRestElement
  parseRestBinding(this: Parser): RestElement {
    const node = this.startNode<RestElement>();
    this.next(); // eat `...`
    node.argument = this.parseBindingAtom();
    return this.finishNode(node, "RestElement");
  }

  // Parses lvalue (assignable) atom.
  parseBindingAtom(this: Parser): Pattern {
    // https://tc39.es/ecma262/#prod-BindingPattern
    switch (this.state.type) {
      case tt.bracketL: {
        const node = this.startNode<ArrayPattern>();
        this.next();
        // @ts-expect-error: Fixme: TSParameterProperty can not be assigned to node.elements
        node.elements = this.parseBindingList(
          tt.bracketR,
          charCodes.rightSquareBracket,
          ParseBindingListFlags.ALLOW_EMPTY
        );
        return this.finishNode(node, "ArrayPattern");
      }

      case tt.braceL:
        return this.parseObjectLike(tt.braceR, true);
    }

    // https://tc39.es/ecma262/#prod-BindingIdentifier
    return this.parseIdentifier();
  }

  // https://tc39.es/ecma262/#prod-BindingElementList
  parseBindingList(
    this: Parser,
    close: TokenType,
    closeCharCode: typeof charCodes[keyof typeof charCodes],
    flags: ParseBindingListFlags
  ): Array<Pattern | TSParameterProperty> {
    const allowEmpty = flags & ParseBindingListFlags.ALLOW_EMPTY;

    const elts: Array<Pattern | TSParameterProperty> = [];
    let first = true;
    while (!this.eat(close)) {
      if (first) {
        first = false;
      } else {
        this.expect(tt.comma);
      }
      if (allowEmpty && this.match(tt.comma)) {
        // @ts-expect-error
        elts.push(null);
      } else if (this.eat(close)) {
        break;
      } else if (this.match(tt.ellipsis)) {
        elts.push(this.parseAssignableListItemTypes(this.parseRestBinding(), flags));
        if (!this.checkCommaAfterRest(closeCharCode)) {
          this.expect(close);
          break;
        }
      } else {
        const decorators = [];
        if (this.match(tt.at) && this.hasPlugin("decorators")) {
          this.raise(Errors.UnsupportedParameterDecorator, {
            at: this.state.startLoc,
          });
        }
        // invariant: hasPlugin("decorators-legacy")
        while (this.match(tt.at)) {
          decorators.push(this.parseDecorator());
        }
        elts.push(this.parseAssignableListItem(flags, decorators));
      }
    }
    return elts;
  }

  // https://tc39.es/ecma262/#prod-BindingRestProperty
  parseBindingRestProperty(this: Parser, prop: Undone<RestElement>): RestElement {
    this.next(); // eat '...'
    // Don't use parseRestBinding() as we only allow Identifier here.
    prop.argument = this.parseIdentifier();
    this.checkCommaAfterRest(charCodes.rightCurlyBrace);
    return this.finishNode(prop, "RestElement");
  }

  // https://tc39.es/ecma262/#prod-BindingProperty
  parseBindingProperty(this: Parser): ObjectMember | RestElement {
    const prop = this.startNode<ObjectMember | RestElement>();
    const { type, startLoc } = this.state;
    if (type === tt.ellipsis) {
      return this.parseBindingRestProperty(prop as Undone<RestElement>);
    } else if (type === tt.privateName) {
      this.expectPlugin("destructuringPrivate", startLoc);
      this.classScope.usePrivateName(this.state.value, startLoc);
      (prop as Undone<ObjectMember>).key = this.parsePrivateName();
    } else {
      this.parsePropertyName(prop as Undone<ObjectMember>);
    }
    (prop as Undone<ObjectMember>).method = false;
    return this.parseObjPropValue(
      prop as Undone<ObjectMember>,
      startLoc,
      false /* isGenerator */,
      false /* isAsync */,
      true /* isPattern */,
      false /* isAccessor */
    );
  }

  parseAssignableListItem(
    this: Parser,
    flags: ParseBindingListFlags,
    decorators: Decorator[]
  ): Pattern | TSParameterProperty {
    const left = this.parseMaybeDefault();
    this.parseAssignableListItemTypes(left, flags);
    const elt = this.parseMaybeDefault(left.loc.start, left);
    if (decorators.length) {
      left.decorators = decorators;
    }
    return elt;
  }

  // Used by flow/typescript plugin to add type annotations to binding elements
  parseAssignableListItemTypes(
    param: Pattern,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    flags: ParseBindingListFlags
  ): Pattern {
    return param;
  }

  // Parses assignment pattern around given atom if possible.
  // https://tc39.es/ecma262/#prod-BindingElement
  parseMaybeDefault(this: Parser, startLoc?: Position | null, left?: Pattern | null): Pattern {
    startLoc ??= this.state.startLoc;
    left = left ?? this.parseBindingAtom();
    if (!this.eat(tt.eq)) return left;

    const node = this.startNodeAt<AssignmentPattern>(startLoc);
    node.left = left;
    node.right = this.parseMaybeAssignAllowIn();
    return this.finishNode(node, "AssignmentPattern");
  }
  /**
   * Return information use in determining whether a Node of a given type is an LVal,
   * possibly given certain additional context information.
   *
   * Subclasser notes: This method has kind of a lot of mixed, but related,
   * responsibilities. If we can definitively determine with the information
   * provided that this either *is* or *isn't* a valid `LVal`, then the return
   * value is easy: just return `true` or `false`. However, if it is a valid
   * LVal *ancestor*, and thus it's descendents must be subsquently visited to
   * continue the "investigation", then this method should return the relevant
   * child key as a `string`. In some special cases, you additionally want to
   * convey that this node should be treated as if it were parenthesized. In
   * that case, a tuple of [key: string, parenthesized: boolean] is returned.
   * The `string`-only return option is actually just a shorthand for:
   * `[key: string, parenthesized: false]`.
   *
   * @param type A Node `type` string
   * @param isUnparenthesizedInAssign
   *        Whether the node in question is unparenthesized and its parent
   *        is either an assignment pattern or an assignment expression.
   * @param binding
   *        The binding operation that is being considered for this potential
   *        LVal.
   * @returns `true` or `false` if we can immediately determine whether the node
   *          type in question can be treated as an `LVal`.
   *          A `string` key to traverse if we must check this child.
   *          A `[string, boolean]` tuple if we need to check this child and
   *          treat is as parenthesized.
   */
  isValidLVal(
    type: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isUnparenthesizedInAssign: boolean,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    binding: BindingTypes
  ): string | boolean {
    return getOwn(
      {
        AssignmentPattern: "left",
        RestElement: "argument",
        ObjectProperty: "value",
        ParenthesizedExpression: "expression",
        ArrayPattern: "elements",
        ObjectPattern: "properties",
      },
      // @ts-expect-error refine string to enum
      type
    );
  }

  /**
   * Verify that a target expression is an lval (something that can be assigned to).
   *
   * @param expression The expression in question to check.
   * @param options A set of options described below.
   * @param options.in
   *        The relevant ancestor to provide context information for the error
   *        if the check fails.
   * @param options.binding
   *        The desired binding type. If the given expression is an identifier
   *        and `binding` is not `BIND_NONE`, `checkLVal` will register binding
   *        to the parser scope See also `src/util/scopeflags.js`
   * @param options.checkClashes
   *        An optional string set to check if an identifier name is included.
   *        `checkLVal` will add checked identifier name to `checkClashes` It is
   *        used in tracking duplicates in function parameter lists. If it is
   *        false, `checkLVal` will skip duplicate checks
   * @param options.strictModeChanged
   *        Whether an identifier has been parsed in a sloppy context but should
   *        be reinterpreted as strict-mode. e.g. `(arguments) => { "use strict "}`
   * @param options.hasParenthesizedAncestor
   *        This is only used internally during recursive calls, and you should
   *        not have to set it yourself.
   */

  checkLVal(
    expression: Expression | ObjectMember | RestElement,
    {
      in: ancestor,
      binding = BIND_NONE,
      checkClashes = false,
      strictModeChanged = false,
      hasParenthesizedAncestor = false,
    }: {
      in: LValAncestor;
      binding?: BindingTypes;
      checkClashes?: Set<string> | false;
      strictModeChanged?: boolean;
      hasParenthesizedAncestor?: boolean;
    }
  ): void {
    const type = expression.type;

    // If we find here an ObjectMethod, it's because this was originally
    // an ObjectExpression which has then been converted.
    // toAssignable already reported this error with a nicer message.
    if (this.isObjectMethod(expression)) return;

    if (type === "MemberExpression") {
      if (binding !== BIND_NONE) {
        this.raise(Errors.InvalidPropertyBindingPattern, { at: expression });
      }
      return;
    }

    if (type === "Identifier") {
      this.checkIdentifier(expression as Identifier, binding, strictModeChanged);

      const { name } = expression as Identifier;

      if (checkClashes) {
        if (checkClashes.has(name)) {
          this.raise(Errors.ParamDupe, { at: expression });
        } else {
          checkClashes.add(name);
        }
      }

      return;
    }

    const validity = this.isValidLVal(
      type,
      !(hasParenthesizedAncestor || expression.extra?.parenthesized) &&
        ancestor.type === "AssignmentExpression",
      binding
    );

    if (validity === true) return;
    if (validity === false) {
      const ParseErrorClass = binding === BIND_NONE ? Errors.InvalidLhs : Errors.InvalidLhsBinding;

      this.raise(ParseErrorClass, { at: expression, ancestor });
      return;
    }

    const [key, isParenthesizedExpression] = Array.isArray(validity)
      ? validity
      : [validity, type === "ParenthesizedExpression"];
    const nextAncestor =
      type === "ArrayPattern" || type === "ObjectPattern" || type === "ParenthesizedExpression"
        ? ({ type } as const)
        : ancestor;

    // @ts-expect-error key may not index expression.
    for (const child of [].concat(expression[key])) {
      if (child) {
        this.checkLVal(child, {
          in: nextAncestor,
          binding,
          checkClashes,
          strictModeChanged,
          hasParenthesizedAncestor: isParenthesizedExpression,
        });
      }
    }
  }

  checkIdentifier(at: Identifier, bindingType: BindingTypes, strictModeChanged: boolean = false) {
    if (
      this.state.strict &&
      (strictModeChanged
        ? isStrictBindReservedWord(at.name, this.inModule)
        : isStrictBindOnlyReservedWord(at.name))
    ) {
      if (bindingType === BIND_NONE) {
        this.raise(Errors.StrictEvalArguments, { at, referenceName: at.name });
      } else {
        this.raise(Errors.StrictEvalArgumentsBinding, {
          at,
          bindingName: at.name,
        });
      }
    }

    if (bindingType & BIND_FLAGS_NO_LET_IN_LEXICAL && at.name === "let") {
      this.raise(Errors.LetInLexicalBinding, { at });
    }

    if (!(bindingType & BIND_NONE)) {
      this.declareNameFromIdentifier(at, bindingType);
    }
  }

  declareNameFromIdentifier(identifier: Identifier, binding: BindingTypes) {
    this.scope.declareName(identifier.name, binding, identifier.loc.start);
  }

  checkToRestConversion(node: Node, allowPattern: boolean): void {
    switch (node.type) {
      case "ParenthesizedExpression":
        this.checkToRestConversion(node.expression, allowPattern);
        break;
      case "Identifier":
      case "MemberExpression":
        break;
      case "ArrayExpression":
      case "ObjectExpression":
        if (allowPattern) break;
      /* falls through */
      default:
        this.raise(Errors.InvalidRestAssignmentPattern, { at: node });
    }
  }

  checkCommaAfterRest(close: typeof charCodes[keyof typeof charCodes]): boolean {
    if (!this.match(tt.comma)) {
      return false;
    }

    this.raise(
      this.lookaheadCharCode() === close ? Errors.RestTrailingComma : Errors.ElementAfterRest,
      { at: this.state.startLoc }
    );

    return true;
  }
}
