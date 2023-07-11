import { parseSync, traverse } from "@babel/core";
import { Location } from "@replayio/protocol";

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

            if ([dispatch, wrapDispatch, middleware].every(f => f?.node.params.length === 1)) {
              isMiddleware = true;
              path.stop();
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
