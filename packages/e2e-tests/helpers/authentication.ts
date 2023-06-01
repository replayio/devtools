// These API keys are required fro authenticated tests,
// even ones that run on forks (where GitHub secrets are unavailable)
// Because our e2e tests are public anyway, these secrets were already visible
// and the impact of leaking them is small, since the users are in an isolated team/workspace

// trunk-ignore(gitleaks/generic-api-key)
export const E2E_USER_1_API_KEY = "ruk_jukvxbSz7syp4Tw21RzEwSK2bjucNDklCEDmVkjbHMA";

// trunk-ignore(gitleaks/generic-api-key)
export const E2E_USER_2_API_KEY = "ruk_K77rBZ4FuPyfj5ocfpPpTXJx7WGVesSySInnCJ4sS1Y";
