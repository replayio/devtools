import { NextApiHandler } from "next";

import { createClient } from "node-protocol";

const address = process.env.NEXT_PUBLIC_DISPATCH_URL;

const SYSTEM_PROMPT = () => `
You are an experienced web developer whose job is to help me understand the JavaScript code that I am looking at.

Can you please add print statements to the code that I am looking at to help me understand the code?

Here are some suggestions for the values to include:
- there should be 3 relevant values
- values should ideally be defined recently
- values can be expressions like foo?.bar

Here are some suggestions for prefixes:
- Prefixes should describe what the line is doing
- prefixes should be less than 30 characters
- prefixes should not include brackets [] or parentheses ()
- prefixes should not be capitalized
- prefixes do not need terms like logging, debug, or info because they are implied


Could you also include a description of what the print statement will log and why you chose the variables/expressions you used?`;

const USER_PROMPT = ({ code, lineNumber }: { code: string; lineNumber: number }) => `

Please return a print statement that is on line ${lineNumber}

~~~
${code
  .split("\n")
  .slice(Math.max(0, lineNumber - 10), lineNumber - 1)
  .join("\n")}
~~~`;

const USER_ERROR_PROMPT = ({
  lineNumber,
  error,
}: {
  lineNumber: number;
  error: { error: string; expression: string };
}) => `
The previous expression ${error.expression} failed with the error ${error.error}. ${
  error.error.includes("SyntaxError") ? "Can you try rephrasing the expression?" : ""
}${
  error.error.includes("ReferenceError") || error.error.includes("TypeError")
    ? "Can you try a different variable?"
    : ""
}

Could you try creating a new print statement on line ${lineNumber} with the format \`log("prefix", ...variables)\`?`;

async function addPrintStatements({
  code,
  lineNumber,
  errors,
}: {
  code: string;
  lineNumber: number;
  errors: { expression: string; error: string }[];
}): Promise<{ expression: string; content: string; description: string }> {
  try {
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
            content: SYSTEM_PROMPT(),
          },
          {
            role: "user",
            content: USER_PROMPT({ code, lineNumber }),
          },
          ...errors.map(error => ({
            role: "user",
            content: USER_ERROR_PROMPT({ error, lineNumber }),
          })),
        ],
      }),
    }).then(r => r.json());

    const content = responseFromChatGpt.choices[0].message.content;
    const expression = content.match(/console.log\((.*)\)/)?.[1];
    if (!expression) {
      console.log("could not find expression", content);
    }

    const description = content.split("\n").slice(5).join("\n");

    return { expression, content, description };
  } catch (e) {
    return { expression: "", content: "", description: "" };
  }
}

async function evalExpression({
  expression,
  recordingId,
  token,
  closestHitPoint,
}: {
  expression: string | undefined;
  recordingId: string;
  token: string;
  closestHitPoint: string;
}): Promise<{ succeeded: boolean; error?: { error: string; expression: string } }> {
  if (!expression) {
    return { succeeded: false, error: { error: "No expression", expression: "" } };
  }
  const { client } = await createClient({ address });
  await client.Authentication.setAccessToken({ accessToken: token });

  const { sessionId } = await client.Recording.createSession({ recordingId });
  const pause = await client.Session.createPause({ point: closestHitPoint }, sessionId);

  if (!pause.stack) {
    return { succeeded: false, error: { error: "No stack trace", expression } };
  }

  const response = await client.Pause.evaluateInFrame(
    { frameId: pause.stack[0], expression, useOriginalScopes: true },
    sessionId,
    pause.pauseId
  );

  client.Recording.releaseSession({ sessionId });

  if (response.result.exception) {
    const exceptionId = response.result.exception.object;
    const exception = response.result.data.objects?.find(o => o.objectId === exceptionId);
    const values: any = exception?.preview?.getterValues?.reduce((acc: any, v) => {
      acc[v.name] = v.value;
      return acc;
    }, {});
    const error = `${values.name} ${values.message}`;
    return { succeeded: false, error: { error, expression } };
  }

  if (response.result.failed) {
    return { succeeded: false, error: { error: "Failed to evaluate", expression } };
  }

  return { succeeded: true };
}

/**
 * @todo put this behind an auth gate so that only Replay.io can use it
 */
const handler: NextApiHandler = async (req, res) => {
  const { code, lineNumber, token, recordingId, closestHitPoint } = req.body;

  let attempts = 0;
  const errors = [];

  try {
    while (attempts++ < 5) {
      const statement = await addPrintStatements({
        code,
        lineNumber,
        errors,
      });

      const { expression, content, description } = statement;
      console.log(`content`, content);
      console.log(`description`, description);

      const result = await evalExpression({
        expression,
        recordingId,
        token,
        closestHitPoint,
      });

      console.log(`result`, result);

      if (result.succeeded) {
        return res.status(200).json({ status: true, expression, description });
      }

      errors.push(result.error);
    }

    return res.status(200).json({ status: false });
  } catch (e) {
    console.error(e);
    return res.status(200).json({ status: false });
  }
};

export default handler;
