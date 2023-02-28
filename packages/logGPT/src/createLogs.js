function getClosestVars(data, lineNum) {
  const variables = data.variablesByLine;
  let closestVars = [];

  for (let index = lineNum; index >= 0; index--) {
    const candidateVars = variables[index] || [];

    for (const candidateVar of candidateVars) {
      if (closestVars.length === 3) {
        return closestVars;
      }
      if (!closestVars.includes(candidateVar)) {
        closestVars.push(candidateVar);
      }
    }
  }

  return closestVars;
}

export default function createLogs(data) {
  const lines = data.statements;

  const logs = {};
  for (const lineIndex in lines) {
    const lineNum = lines[lineIndex];

    // start at the current line and then go up until
    // we get 3 candidate vars.
    const closestVars = getClosestVars(data, lineNum);

    // console.log(lines[lineIndex], closestVars);
    if (closestVars.length > 0) {
      logs[lines[lineIndex]] = closestVars;
    }
  }
  return logs;
}
