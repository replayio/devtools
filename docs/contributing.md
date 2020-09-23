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