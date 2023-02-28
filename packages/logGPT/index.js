import findVariables from "./src/findVariables";
import fs from "fs";
import path from "path";
import createLogs from "./src/createLogs";

// get the current working directory
const cwd = process.cwd();

function getInput(filename) {
  const code = fs.readFileSync(path.join(cwd, "input", filename), "utf8");
  return code;
}

function writeFile(filename, content) {
  fs.writeFileSync(path.join(cwd, "out", filename), content, "utf8");
}

function formatCode(code, logs) {
  let out = "";
  const codeLines = code.split("\n");
  // console.log(logs);
  for (const lineIndex in codeLines) {
    const codeLine = codeLines[lineIndex];

    const lineNum = +lineIndex + 1;
    if (logs[lineNum]) {
      const spaces = " ".repeat(codeLine.match(/\S/)?.index ?? 0);
      out += `\n${spaces}// log(${logs[lineNum].join(", ")})\n`;
    }
    out += codeLine + "\n";
  }

  return out;
}

function getLogs(filename) {
  console.log(`Getting logs for`, filename);
  const code = getInput(filename);

  const data = findVariables(code);
  writeFile(`${filename}.vars.json`, JSON.stringify(data.variablesByLine, null, 2));

  const logs = createLogs(data);
  const formattedCode = formatCode(code, logs);
  writeFile(`${filename}`, formattedCode);
  return formattedCode;
}

// files in a directory
// const files = fs.readdirSync(path.join(cwd, "input"));
// files.slice(0, 10).forEach(file => getLogs(file));

getLogs("_scopes.js");
