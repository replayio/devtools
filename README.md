![](https://replay.io/assets/logo.svg)
##  Replay


Replay is a new debugger for recording and replaying software. Debugging with Replay should be as simple as viewing print statements and more powerful than pausing with breakpoints. Ofcourse, debugging should be collaborative as well!

### Issues

Feel free to file any issues you see while recording or replaying.


### Feature Requests

We track feature requests in [canny](https://replay.canny.io/). 

We use Canny for 3 reasons:

- Discuss the future of Replay with the community
- Plan in the open. Our roadmap is transparent :)
- Keep the issue backlog actionable.


### Setup instructions:

Replay's DevTools is a React app built on top of the Replay [protocol](https://www.notion.so/replayio/Protocol-d8e7b5f428594589ab60c42afad782c1). Getting started should be as simple as:

```
git clone git@github.com:RecordReplay/devtools.git
npm install 
npm start
```

Then open http://localhost:8080/view?id=79f0cacd-727b-456d-8970-dbb4866ce6c7 in any browser. You can also view any of the recordings you've made as well by replacing the recording ids.

### Running tests:

```
node test/run.js [--pattern pat]
```
