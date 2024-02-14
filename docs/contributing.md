# Contributing

## Getting started

DevTools is a React app built with webpack. Here are the steps for getting started:

```bash
git clone git@github.com:RecordReplay/devtools.git

nvm use

cp .env.sample .env

yarn install
yarn dev
```

Once you see `Compiled successfully` in your terminal, open your browser and go to [this link](http://localhost:8080/recording/79f0cacd-727b-456d-8970-dbb4866ce6c7).

If you have questions, you can always ask in our [#development](https://discord.com/channels/779097926135054346/795692423513767956) Discord channel.

## Contributing code

> ### 💡 WARNING: Not following these rules will result in your PR being closed

Contributing to Open Source can be challenging. Mistakes –even small ones– can prevent a change from being accepted. We ask that you follow the rules below to make the process as smooth as possible!

1. Before posting a PR, please run all Lint, typecheck, and test actions:
   - Run TypeScript (`npm run typecheck`) and Lint (`npm run lint`) to check for errors and formatting issues.
   - Run unit tests (`npm run test`) to check if change broke other code.
   - Add new unit tests for your code and make sure that it also passes. (This helps the reviewer. It also verifies that your code works correctly now and does not get broken by future changes.)
1. Open a [PR on GitHub](https://github.com/replayio/devtools/pulls) with your changes. The PR description must include the following:
   - Link to the GitHub issue you are fixing (and any other relevant links)
   - Show how your change effects the UI/UX. (Screenshots, short Loom videos and Replays are good ways to show changes.)
1. (Optionally) ask someone to review your PR by mentioning their GitHub username.
   - Please only mention someone if they opened the GitHub issue your PR is related to, or if they actively commented on it and seem to have an understanding of the topic.
   - Please be patient as it may take several days for a PR to be reviewed.
