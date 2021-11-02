import { getAccessToken, withApiAuthRequired } from "@auth0/nextjs-auth0";
// import sign from "jwt-encode";

export default withApiAuthRequired(async function graphql(req, res) {
  // try {
  //   const { accessToken } = await getAccessToken(req, res);
  //   console.log(accessToken);
  //   if (!accessToken) {
  //     resp.status(401).send();
  //     return;
  //   }
  //   const token = sign({
  //     access_token: accessToken,
  //   });
  //   const resp = await fetch(process.env.API_URL, {
  //     method: req.method,
  //     headers: {
  //       Authorization: `Bearer ${accessToken}`,
  //     },
  //     body: req.body,
  //   });
  //   const body = await resp.text();
  //   res.status(resp.status);
  //   res.statusMessage = resp.statusText;
  //   res.send(body);
  // } catch (error) {
  //   console.error(error);
  //   res.status(500).end(error.message);
  // }
});
