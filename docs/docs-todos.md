# Replay Client Architecture Documentation Todos

A list of concepts and questions about the Replay client architecture and implementation that we really ought to document, for the sake of ourselves and anyone else looking at this codebase.

- Overall folder layout
  - [ ] What is the top-level structure of the repo?
  - [ ] What does each folder within `src` contain?
  - [ ] What is the difference between the `devtools` folder and the `ui` folder? What's the historical background of the different areas of the codebase (FF devtools, new Replay code, etc)
  - [ ] What areas of the codebase are likely dead at this point?
- App setup and scaffolding
  - [ ] What is the overall app bootstrap process?
  - [ ] What are the main entry points / pages?
  - [ ] How does a Redux store get created and initialized?
  - [ ] Why is Redux store setup split across multiple files? How does that sequence work and what extra bootstrapping is required?
  - [ ] What global variables are in use?
- Data flow and state management
  - [ ] Why do we have both Apollo Client + GraphQL, and Redux?
  - [ ] What data lives in Apollo and what is in Redux?
  - [ ] When do we fetch pieces of data like comments, sources, messages, etc?
  - [ ] What are the most critical sections of the state / client logic?
  - [ ] What does the overall data flow look like, both client<-> server, and within the client itself?
- Replay client and protocol
  - [ ] What is `ThreadFront`?
  - [ ] How does the Replay client communicate to the backend (sockets, AJAX, etc)?
  - [ ] What is `ValueFront`?
- Styling
  - [ ] How do we normally manage styling components?
  - [ ] Where would I find our main theme definitions?
- Testing
  - [ ] What tests exist?
  - [ ] How do you run unit tests?
  - [ ] How do you write unit tests?
  - [ ] Where does the E2E test setup live?
  - [ ] How do you run E2E tests? What are the prerequisites?
  - [ ] How do I view components in Storybook?
- Other
  - [ ] How does the React DevTools integration work with a replay?
