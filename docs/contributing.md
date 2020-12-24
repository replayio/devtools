# Contributing

## Contributors

### Getting started

DevTools is a React app built with webpack. Here are the steps for getting started, if you have any questions, you can always ask us in our #community slack channel.

```bash
git clone git@github.com:RecordReplay/devtools.git
npm install 
npm start
```

Once you see `Compiled succesfully` in your terminal, open your browser and go to [this link](http://localhost:8080/view?id=79f0cacd-727b-456d-8970-dbb4866ce6c7).


## Maintainers

### Updating a PR

Github allows maintainers to push to contributor branches

1. check to see if the PR allows edits [link](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/allowing-changes-to-a-pull-request-branch-created-from-a-fork)

2. Add the contributor's fork as a remote e.g.

```bash
git remote add jaril git@github.com:jaril/webreplay-devtools.git
```

3. push your updates

```bash
git push jaril readme-changes
```

## Issue Labeling Guide

### **Parent Categories**

Every issue will have at least a parent category and may have a more granular child category.

The more granular categories would be labeled according to this list. Underlined is the name of the label and below it is the list of what that label encompasses.

### **Overarching category labels:**
*Color code for these labels are #D876E3*

<u>Bug</u>
- All bugs

<u>Feature</u>
- New feature requests

<u>Tooling</u>
- Tests
- Logrocket

<u>UI Polish</u>
- Anything UI that isn't broken or functionality related

<u>Performance</u>
- Lagging and other performance issues


### **Labels for Bug or Feature:**
*Color code for these labels are #CCEBFF*

<u>Debugger</u>
- Sidebar Panel and all its contents
- Accordions
- Editor

<u>Viewer</u>
- Issues related *specifically* to the viewer that don't carry over to Debug mode

<u>Comments</u>
- Comments / Transcripts in both View and Debug mode

<u>Elements</u>
- Anything within the Elements panel
- Inspector

<u>Console</u>
- Anything within the Console Panel

<u>Timeline</u>
- The Timeline in both View and Debug mode

<u>Video</u>
- The Video player in both View and Debug mode

<u>Account</u>
- User's dashboard and profile

### **Examples:**
- Jack can't expand a node in the sources tree: ["bug", "debugger"]
- Jill can't fastforward the timeline on play mode: ["bug", "timeline"]
- The hill wants to make it rain glitter from the screen when it hovers over comments in play mode: ["feature", "comments"]
- Jack would like to right click and inspect on Viewer mode: ["feature", "viewer"]
