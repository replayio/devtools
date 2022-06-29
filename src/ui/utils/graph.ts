export interface Graph {
  addNode(node: string): void;
  connectNode(from: string, to: string): void;
  from: (node: string) => string[];
  to: (node: string) => string[];
}

const newGraph = (): Graph & { inspect: () => string } => {
  const incoming: Record<string, string[]> = {};
  const outgoing: Record<string, string[]> = {};

  const addNode = (node: string) => {
    incoming[node] = incoming[node] || [];
    outgoing[node] = outgoing[node] || [];
  };

  const connectNode = (from: string, to: string) => {
    addNode(from);
    addNode(to);
    outgoing[from].push(to);
    incoming[to].push(from);
  };

  const inspect = () => {
    return JSON.stringify({ outgoing, incoming }, null, 2);
  };

  return {
    from: (node: string) => outgoing[node],
    to: (node: string) => incoming[node],
    addNode,
    connectNode,
    inspect,
  };
};

export default newGraph;
