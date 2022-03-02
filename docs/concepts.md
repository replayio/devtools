concepts:

```
grip
reps
front types
  nodefront
  threadfront
  consolefront
  DOMfront
  changesfront
  valuefront
  headersfront
  globalfront
  RuleFront
  stylesheetfront
wired types
  wired frame
  wired scope
  wired object
  wired eventlistener
  wired appliedrule
  wired containerentry
  wired property
  wired namedvalue
scopes
frames
pause (point)
logpoint
watchpoint
region
```

important objects and/or components:

```
- ThreadFront
- ProtocolClient
- domains: Video(Player), AnalysisManager
- DevTools
  - DevToolsToolbox
    - Selection
    - panels:
      - Inspector ("elements")
        - MarkupView
        - RulesView
        - BoxModel
      - DebuggerPanel ("debugger")
        - Editor (in devtools debugger, source-editor.js)
      - React DevTools
- Highlighter (quasi under DevToolsBox as well)
- NodePicker
- JSTerm (jsterm.js) from ConsolePanel (WebConsole)
- ObjectInspector
```
