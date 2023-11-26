import { buildCallTree } from "./groupByCallStack";
import { buildCallTree as realBuildCallTree } from "./RecordingTestMetadata";
import events from "./simplified.json"
import eventsWithLines from "./simplified-lines.json"
import eventsWithLines2 from "./simplified-lines-2.json"

import ugly from './events.json'
import ugly2 from './events2.json'

import { TreeNode } from "devtools/client/debugger/src/utils/sources-tree/types";

function simplifyEvents(events: Event[]) {
  return events.map(event => ({
    command: event.command.name,
    callStack: event.call_stack.reverse().map((frame, index) => `${frame.functionName || frame.fileName}.${event.call_stack[index - 1]?.lineNumber || ""}`)
  }))
}

const simplifiedStacks = events.map(e => e.callStack)
const simplifiedStacksWithLines = eventsWithLines.map(e => e.callStack)

function simplifyEvents2(events: any[]) {
  return events.map(event => ({
    command: event.data.command.name,
    callStack: event.data.testSourceCallStack.map(
      (frame, index) => `${frame.functionName || frame.fileName}.${event.data.testSourceCallStack?.[index - 1]?.lineNumber || ""}`
    )
  }))
}




// console.log(JSON.stringify(simplifyEvents2(ugly2), null, 2))

interface Node {
  name: string;
  type: "command" | "function";
  children: Node[];
}

function printNode(node: Node, depth: number = 0) {
  let text = ''
  text += (' '.repeat(depth * 2) + (node.type == "command" ? `_${node.name}_` : node.name.replace(/\.\d*$/, '')) + "\n");

  text += node.children?.map(child => printNode(child, depth + 1))?.join("\n") || "";
  return text;
}

function convertJsonToAscii(root: Node) {
  const res = printNode(root)
  return res.replace(/\n\s*\n/g, '\n').trim();
}

function printRealNode(node: any, depth: number = 0) {
  let text = ''
  text += (' '.repeat(depth * 2) + (node.type == "user-action" ? `_${node.data.command.name}_` : node.data.function.replace(/\.\d*$/, '')) + "\n");

  text += node.data.events?.map(child => printRealNode(child, depth + 1))?.join("\n") || "";
  return text;
}

function convertRealJsonToAscii(root: Node) {
  const res = printRealNode(root)
  return res.replace(/\n\s*\n/g, '\n').trim();
}



function unindent(text: string) {
  const lines = text.split('\n');
  const indent = lines[1].match(/^ */)![0].length;
  return [...lines.slice(1).map(line => line.slice(indent))].join('\n').trim();

}


describe("groupByCallStacks", () => {

  xit("events w/ lines", () => {
    console.log(simplifiedStacksWithLines.length)
    const out = convertJsonToAscii(buildCallTree((eventsWithLines as TreeNode).slice(0, 500)))
    expect(out).toMatchSnapshot()
  })


  xit("raw events 1", () => {
    console.log(JSON.stringify(realBuildCallTree(ugly.events.main.slice(0, 500)), null, 2))
  })

  xit("events 2", () => {
    console.log(convertJsonToAscii(buildCallTree(eventsWithLines2)))
  })

  it("raw events 2", () => {
    console.log(convertRealJsonToAscii(realBuildCallTree(ugly2.slice(0, 5000))))
  })


  xit("add commands", () => {
    function parseInput(input: string) {
      const [cmd, stack] = input.split(":")
      return { command: cmd, callStack: stack.split(",") }
    }
    // Example usage
    const input1 = ["eval: a,b", "goto: a,c"];
    const tree1 = buildCallTree(input1.map(parseInput));
    console.log(JSON.stringify(tree1, null, 2));

    const input2 = ["eval: a,b,c,d", "goto: a,b,e,f", "goto: a,b,e"];
    const tree2 = buildCallTree(input2.map(parseInput));
    console.log(JSON.stringify(tree2, null, 2));
  })
})

