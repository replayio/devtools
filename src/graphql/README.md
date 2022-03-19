This entire folder's content is auto-generated.

Editing any of these files manually is not recommended.

### Generating GraphQL types for Typescript

```bash
npm i -g graphqurl

HASURA_KEY=<key> npm run gql
```

Ask somebody on the team to provide the `<key>` to you, which is Hasura admin secret.

❗ **DONT'T EVER COMMIT THIS KEY, IT'S SUPPOSED TO BE A SECRET** ❗

The CI will catch if there are any inconsistencies between what you are trying to commit through a PR and the actual schema version on the backend by comparing the two.