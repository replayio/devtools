type TreeNode = {
  name: string;
  type: string;
  children?: TreeNode[];
};

type Command = {
  command: string;
  callStack: string[]
}

export function buildCallTree(commands: Command[]): TreeNode | null {
  const root: TreeNode = { name: '', type: 'root', children: [] };

  for (const cmd of commands) {
    const { callStack, command } = cmd

    let currentNode = root;
    for (const func of callStack) {
      let child = currentNode.children?.find(c => c.name === func);
      if (!child) {
        child = { name: func, type: 'function', children: [] };
        currentNode.children?.push(child);
      }
      currentNode = child;
    }
    currentNode.children?.push({ name: command, type: 'command' });
  }

  return root.children && root.children.length > 0 ? root.children[0] : null;
}
