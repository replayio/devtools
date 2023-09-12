import { NextApiRequest, NextApiResponse } from "next";

const { FORM_CARRY_TOKEN } = process.env;

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  try {
    console.log("[/api/feedback] posting:\n\n", request.body);

    // https://formcarry.com/form/nextjs-contact-form
    const apiResponse = await fetch(`https://formcarry.com/s/${FORM_CARRY_TOKEN}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(request.body),
    });

    const text = await apiResponse.text();

    console.log("[/api/feedback] response:\n\n", text);

    response.status(200).send({ success: true });
  } catch (error) {
    console.error(error);

    response.status(500).send({ error: true });
  }
}
