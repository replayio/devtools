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
```

important objects:

```
- ThreadFront
- ProtocolClient
- domains: Video(Player), AnalysisManager
- DevTools
  - DevToolsToolbox
    - Selection
    - panels:
      - Inspector
        - MarkupView
        - RulesView
        - BoxModel
      - DebuggerPanel
- Highlighter (quasi under DevToolsBox as well)
- NodePicker
- (Editor (in devtools debugger, source-editor.js))
- JSTerm (jsterm.js) from ConsolePanel (WebConsole)
```