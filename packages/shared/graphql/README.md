The contents of the `"generated"` directory are auto-generated. Editing any of these files manually **is not recommended**.

### Generating GraphQL types for Typescript

```bash
HASURA_KEY=<key> yarn gql
```

Ask somebody on the team to provide the `<key>` to you, which is Hasura admin secret.

❗ **DONT'T EVER COMMIT THIS KEY, IT'S SUPPOSED TO BE A SECRET** ❗

The CI will catch if there are any inconsistencies between what you are trying to commit through a PR and the actual schema version on the backend by comparing the two.
