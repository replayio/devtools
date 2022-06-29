import newGraph from "./graph";

describe("Graph", () => {
  it("can have a node added", () => {
    const graph = newGraph();
    graph.addNode("a");
    expect(graph.from("a")).toEqual([]);
    expect(graph.to("a")).toEqual([]);
  });

  it("can have a connection added", () => {
    const graph = newGraph();

    graph.connectNode("a", "b");

    expect(graph.from("a")).toEqual(["b"]);
    expect(graph.to("b")).toEqual(["a"]);
    expect(graph.to("a")).toEqual([]);
    expect(graph.from("b")).toEqual([]);
  });

  it("can have a node connected to itself", () => {
    const graph = newGraph();

    graph.connectNode("a", "a");

    expect(graph.from("a")).toEqual(["a"]);
    expect(graph.to("a")).toEqual(["a"]);
  });
});
