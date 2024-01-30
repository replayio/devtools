// These API keys are required for authenticated tests,
// even ones that run on forks (where GitHub secrets are unavailable)
// Because our e2e tests are public anyway, these secrets were already visible
// and the impact of leaking them is small, since the users are in an isolated team/workspace

export interface TestUser {
  apiKey: string;
  email: string;
}

// Can view the "Replay: Authenticated e2e tests" workspace
export const E2E_USER_1: TestUser = {
  // trunk-ignore(gitleaks/generic-api-key)
  apiKey: "ruk_jukvxbSz7syp4Tw21RzEwSK2bjucNDklCEDmVkjbHMA",
  email: "frontende2e1@replay.io",
};

// Can view the "Replay: Authenticated e2e tests" workspace
export const E2E_USER_2: TestUser = {
  // trunk-ignore(gitleaks/generic-api-key)
  apiKey: "ruk_K77rBZ4FuPyfj5ocfpPpTXJx7WGVesSySInnCJ4sS1Y",
  email: "frontende2e2@replay.io",
};

// Can view the "Replay Devtools Snapshots" (Test Suites) workspace
// but cannot upload new recordings nor source-maps
// trunk-ignore(gitleaks/generic-api-key)
export const E2E_USER_4_API_KEY = "rwk_CaQCN8h7Wz794K1Yx2200FOcta24j7NkJaYO07TNndV";
export const E2E_USER_4_TEAM_ID = "dzpmMDZkNWI5OS05MWYzLTRhYTktYTYyNC0zMDRjYjJlYjBlYzk=";

// With only read:workspace role
// trunk-ignore(gitleaks/generic-api-key)
export const TEST_RUN_WORKSPACE_API_KEY = "rwk_ONquDEbGGXrjs0yvuON1BhSiAUdlAz8CAl7BlB4igHo";
export const TEST_RUN_WORKSPACE_TEAM_ID = "dzplODhmZjY1Mi0wYTdmLTRhZDgtOTNiYS04OTZmMTBjYjRjM2Q=";
