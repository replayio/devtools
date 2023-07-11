import { NodePath, parseSync, types as t, traverse } from "@babel/core";
import { Location } from "@replayio/protocol";

function parentReturnsChildFn(parentFn: NodePath<t.Function>, childFn: NodePath<t.Function>) {
  // handles `{ return _ => {} }`
  if (t.isBlockStatement(parentFn.node.body)) {
    const returnStmt = parentFn.node.body.body.find((n): n is t.ReturnStatement =>
      t.isReturnStatement(n)
    );

    if (returnStmt) {
      if (returnStmt.argument === childFn.node) {
        return true;
      }
    }
  }

  // handles `=> _ => {}`
  if (t.isArrowFunctionExpression(parentFn.node.body) && parentFn.node.body === childFn.node) {
    return true;
  }

  return false;
}

export function isReduxMiddleware(sourceContents: string, location: Location) {
  try {
    const ast = parseSync(sourceContents, {});
    let isMiddleware = false;

    if (ast) {
      traverse(ast, {
        Identifier(path) {
          const node = path.node;
          const loc = node.loc;
          if (loc?.start.line === location.line && loc.start.column === location.column) {
            // found the node that we paused at
            // so the parent callback here should be of type `store => next => action => {}`
            const dispatch = path.getFunctionParent();
            const wrapDispatch = dispatch?.getFunctionParent();
            const middleware = wrapDispatch?.getFunctionParent();

            if (dispatch && wrapDispatch && middleware) {
              if (
                parentReturnsChildFn(wrapDispatch, dispatch) &&
                parentReturnsChildFn(middleware, wrapDispatch)
              ) {
                isMiddleware = true;
                path.stop();
              }
            }
          }
        },
      });
    }

    return isMiddleware;
  } catch (e) {
    return false;
  }
}
