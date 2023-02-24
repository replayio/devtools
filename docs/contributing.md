# Contributing

Replay is a small team building a time traveling debugger for the web. We value focus and try to make every minute count. Therefore we only accept PRs that fit the following criteria:

1. A simple change that fixes a simple problem, like a typo.
2. A fix for a bug that is verified with a regression test.
3. You're a person we have established a relationship with, probably over Discord or Email.

If your pull request does not meet these criteria, it will be closed.

## Contributors

### Getting started

DevTools is a React app built with webpack. Here are the steps for getting started, if you have any questions, you can always ask us in our Discord server.

```bash
git clone git@github.com:RecordReplay/devtools.git
yarn install
yarn dev
```

Once you see `Compiled succesfully` in your terminal, open your browser and go to [this link](http://localhost:8080/recording/79f0cacd-727b-456d-8970-dbb4866ce6c7).

## Issue Labeling Guide

All issues have labels according to what category they fall into. We do this for ease of organizing and assigning issues as well as to keep track of high priority bugs that need to be fixed immediately.
Refer to the examples list below to see what some issues might be labeled.
You can find descriptions for each label in this [list](https://github.com/RecordReplay/devtools/issues/labels).

Every issue will have at least a parent category (pink labels) and may have a more granular child category (blue labels).
The more granular categories would be labeled according to what specific feature of the app is having an issue.

### **Examples:**

- Ron can't expand a node in the sources tree: ["bug", "debugger"]
- Anne can't fastforward the timeline on play mode: ["bug", "timeline"]
- Leslie wants to make it rain glitter from the screen when she hovers over comments in play mode: ["feature", "comments"]
- Andy would like to right click and inspect on Viewer mode: ["feature", "viewer"]
- Donna notices an error in the console every time she hovers over the source code: ["bug", "editor"]
- Tom wants to custom theme his Replay just like he would his IDE: ["feature", "UI Polish"]
- April's browser crashes when she tries to play a video': ["bug", "P1", "browser", "video"]
- Garry's recording list on his dashboard won't show him all of his recordings: ["bug", "account"]
