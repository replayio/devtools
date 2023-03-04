import { NextApiHandler } from "next";

import { createClient } from "node-protocol";

const address = process.env.NEXT_PUBLIC_DISPATCH_URL;

async function generateExpression({ code, lineNumber }: { code: string; lineNumber: number }) {
  const responseFromChatGpt = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `            
You are an experienced web developer whose job is to help me add print statements that will help me understand the code.

- You must respond to me in the following format \`log("prefix", ...variables)\`
- Variables should not have quotes around them
- There should be at most 3 variables
- You should first include the variables that are used on the line
- You should not include variables that are imported from other files or packages
- Do not include variables that refer to functions or classes
- The prefix should be a short description of what the line does
- The prefix should be less than 30 characters

            `,
        },
        {
          role: "user",
          content: `
          
Please return a print statement that is on line ${lineNumber} 

~~~    
${code}
~~~`,
        },
      ],
    }),
  }).then(r => r.json());

  const expression = responseFromChatGpt.choices[0].message.content.slice(4, -1);
  return expression;
}

async function evalExpression({
  expression,
  recordingId,
  token,
  closestHitPoint,
}: {
  expression: string;
  recordingId: string;
  token: string;
  closestHitPoint: string;
}) {
  const { client } = await createClient({ address });
  await client.Authentication.setAccessToken({ accessToken: token });

  const { sessionId } = await client.Recording.createSession({ recordingId });
  console.log(`sessionId`, sessionId, closestHitPoint);
  const pause = await client.Session.createPause({ point: closestHitPoint }, sessionId);

  if (!pause.stack) {
    return { succeeded: false, error: "No stack trace" };
  }
  console.log("pause", pause);

  const response = await client.Pause.evaluateInFrame(
    { frameId: pause.stack[0], expression },
    sessionId,
    pause.pauseId
  );

  if (response.result.failed || response.result.exception) {
    console.log(`expression`, expression);
    console.log(JSON.stringify(response, null, 2));
    return { succeeded: false, error: response.result.exception };
  }

  return { succeeded: true };
}

/**
 * @todo put this behind an auth gate so that only Replay.io can use it
 */
const handler: NextApiHandler = async (req, res) => {
  const { code, lineNumber, token, recordingId, closestHitPoint } = req.body;

  let expression = await generateExpression({
    code,
    lineNumber,
  });

  // eval expression
  // if good -> return
  const result = await evalExpression({
    expression,
    recordingId,
    token,
    closestHitPoint,
  });

  console.log(`result`, result);

  return res.status(200).end({ expression, result });
  if (result.succeeded) {
    return res.status(200).end({ expression, result });
  }

  // if bad -> generate new expression
};

export default handler;
