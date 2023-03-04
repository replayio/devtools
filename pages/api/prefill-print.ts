import { NextApiHandler } from "next";

/**
 * @todo put this behind an auth gate so that only Replay.io can use it
 */
const handler: NextApiHandler = async (req, res) => {
    const { code, lineNumber } = req.body;

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
                    content:
                        "You are an experienced web developer who is familiar with finding bugs and explaining code",
                },
                {
                    role: "user",
                    content: `Please return a print statement that is on line ${lineNumber} that helps me understand the line.

- The print statement must follow this format \`log("prefix", ...variables)\`
- the variables have absolutely no quotes around them, but the prefix does
- DO NOT RETURN ANY TEXT OTHER THAN THAT FORMAT
- variables should contain all the variables used on that line but must not include more than 3 variables
- ignore variables that are imported from other files or packages
- variables must not reference functions
- prefix should be 3 words or less

Here is the code
~~~    
${code}
~~~`,
                },
            ],
        }),
    }).then(r => r.json());

    res.end(responseFromChatGpt.choices[0].message.content)
}

export default handler