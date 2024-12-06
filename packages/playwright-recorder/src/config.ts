export default {
  backendUrl: process.env.DISPATCH_ADDRESS || "wss://dispatch.replay.io",
  graphqlUrl: process.env.GRAPHQL_ADDRESS || "https://api.replay.io/v1/graphql",
  browserPath: process.env.RECORD_REPLAY_PATH,
  driverPath: process.env.RECORD_REPLAY_DRIVER,
  headless: process.env.RECORD_REPLAY_PLAYWRIGHT_HEADLESS != "false",
};
