export function getAuthHost() {
  return process.env.NEXT_PUBLIC_AUTH_HOST || "webreplay.us.auth0.com";
}

export function getAuthClientId() {
  return process.env.NEXT_PUBLIC_AUTH_CLIENT_ID || "4FvFnJJW4XlnUyrXQF8zOLw6vNAH1MAo";
}
