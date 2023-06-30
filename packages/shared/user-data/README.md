# `shared/user-data`

This package manages persistance and synchronization of user data falling into three categories:

- Preferences: Things that are typically managed in a settings dialog
- Features: New or experimental things that we want to give people a way to opt-in or opt-out from
- History: Things we remember between sessions, e.g. the most recently selected tab

## How should data be stored?

There are a couple of options for managing user data. Deciding which one to use requires answering a few questions. First, should this data follow a user wherever they go? (For example, a user's "role" is the same regardless of which browser or computer they use.)

### Roaming data

Data that should follow a user belongs should be managed by the `shared/user-data/GraphQL` package. Data managed by this package is saved to both `localStorage` (for sync initialization on startup) _and_ GraphQL (for sharing between environments).

The `useGraphQLUserData` can be used by React components to read/write saved data, and the `UserData` API can be used by imperative code to subscribe to changes in data (e.g. when the user changes the application theme).

### Local data

Data that does not need to follow a user can be stored in either [`localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) or [`IndexedDB`](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API). When deciding between the two, consider the following trade-offs:

| Description             | `localStorage` | `IndexedDB` |
| ----------------------- | :------------: | :---------: |
| Synchronous read/write  |       ✅       |     ❌      |
| Larger storage capacity |       ❌       |     ✅      |

Being able to read values synchronously can simplify app initialization, but `localStorage` has a hard limit of ~5MB which means that it should not be used for values that grow over time (e.g. user history, per-recording preferences).

Data stored in `localStorage` directly should be managed by the `shared/user-data/localStorage` package (and the `useLocalStorageUserData` hook).

Data stored in `IndexedDB` directly should be managed by the `shared/user-data/IndexedDB` package (and the `useIndexedDBUserData` hook).
