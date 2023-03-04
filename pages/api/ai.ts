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
                    content: `Given this file:
       
${code.join('\n')}

Explain the following line to a new developer:

${code[lineNumber - 1]}

Specifically explain how we got here and what bugs might be lurking in this code. If you can do bullet points just for the potential bugs, do bullet points.`,
                },
            ],
        }),
    }).then(r => r.json());

    res.end(responseFromChatGpt.choices[0].message.content)
}

export default handler