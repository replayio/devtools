import { IronSessionData, IronSessionOptions, sealData, unsealData } from "iron-session";
import { withIronSessionApiRoute, withIronSessionSsr } from "iron-session/next";
import { GetServerSidePropsContext, GetServerSidePropsResult, NextApiHandler } from "next";

const sessionOptions: IronSessionOptions = {
  password: process.env.IRON_PASSWORD,
  cookieName: "replay_session",
  ttl: 30 * 24 * 60 * 60, // 30 days
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    path: "/",
    httpOnly: false,
  },
};

export async function parseToken(token: string) {
  return unsealData<IronSessionData["profile"]>(token, sessionOptions);
}

export async function generateToken(value: unknown) {
  // This is dumb and means we have to encrypt twice but session.save() doesn't
  // return the encrypted value so here we are for now.
  return sealData(value, sessionOptions);
}

export function withSessionRoute(handler: NextApiHandler) {
  return withIronSessionApiRoute(handler, sessionOptions);
}

// Theses types are compatible with InferGetStaticPropsType https://nextjs.org/docs/basic-features/data-fetching#typescript-use-getstaticprops
export function withSessionSsr<P extends { [key: string]: unknown } = { [key: string]: unknown }>(
  handler: (
    context: GetServerSidePropsContext
  ) => GetServerSidePropsResult<P> | Promise<GetServerSidePropsResult<P>>
) {
  return withIronSessionSsr(handler, sessionOptions);
}

declare module "iron-session" {
  interface IronSessionData {
    profile?: { userId: string };
  }
}
