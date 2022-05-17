# Circular Import Problems

Running the Webpack circular deps check plugin (set `CHECK_CIRCULAR_IMPORTS=true` and run `npm run build`):

```
Circular dependency detected:
src\devtools\client\debugger\src\actions\ast.js -> src\protocol\thread\index.ts -> src\protocol\thread\thread.ts -> src\protocol\graphics.ts -> src\protocol\screenshot-cache.ts -> src\protocol\socket.ts -> src\ui\actions\session.ts -> src\ui\actions\app.ts -> src\devtools\client\debugger\src\actions\quick-open.ts -> src\devtools\client\debugger\src\actions\ast.js

Circular dependency detected:
src\devtools\client\debugger\src\actions\breakpoints\breakpointPositions.js -> src\devtools\client\debugger\src\selectors\index.ts -> src\devtools\client\debugger\src\reducers\sources.ts -> src\devtools\client\debugger\src\utils\source.js -> src\protocol\thread\index.ts -> src\protocol\thread\thread.ts -> src\protocol\graphics.ts -> src\protocol\screenshot-cache.ts -> src\protocol\socket.ts -> src\ui\actions\session.ts -> src\ui\actions\app.ts -> src\devtools\client\debugger\src\actions\ui.js -> src\devtools\client\debugger\src\actions\sources\select.ts -> src\devtools\client\debugger\src\actions\tabs.js -> src\devtools\client\debugger\src\actions\sources\index.js -> src\devtools\client\debugger\src\actions\sources\newSources.ts -> src\devtools\client\debugger\src\actions\breakpoints\index.js -> src\devtools\client\debugger\src\actions\breakpoints\modify.js -> src\devtools\client\debugger\src\actions\breakpoints\breakpointPositions.js

Circular dependency detected:
src\devtools\client\debugger\src\actions\breakpoints\breakpoints.ts -> src\devtools\client\debugger\src\actions\breakpoints\index.js -> src\devtools\client\debugger\src\actions\breakpoints\breakpoints.ts

Circular dependency detected:
src\devtools\client\debugger\src\actions\breakpoints\index.js -> src\devtools\client\debugger\src\selectors\index.ts -> src\devtools\client\debugger\src\reducers\sources.ts -> src\devtools\client\debugger\src\utils\source.js -> src\protocol\thread\index.ts -> src\protocol\thread\thread.ts -> src\protocol\graphics.ts -> src\protocol\screenshot-cache.ts -> src\protocol\socket.ts -> src\ui\actions\session.ts -> src\ui\actions\app.ts -> src\devtools\client\debugger\src\actions\ui.js -> src\devtools\client\debugger\src\actions\sources\select.ts -> src\devtools\client\debugger\src\actions\tabs.js -> src\devtools\client\debugger\src\actions\sources\index.js -> src\devtools\client\debugger\src\actions\sources\newSources.ts -> src\devtools\client\debugger\src\actions\breakpoints\index.js

Circular dependency detected:
src\devtools\client\debugger\src\actions\breakpoints\logpoints.ts -> src\devtools\client\debugger\src\reducers\breakpoints.ts -> src\devtools\client\debugger\src\utils\breakpoint\index.ts -> src\protocol\thread\index.ts -> src\protocol\thread\thread.ts -> src\protocol\graphics.ts -> src\protocol\screenshot-cache.ts -> src\protocol\socket.ts -> src\ui\actions\session.ts -> src\ui\actions\app.ts -> src\devtools\client\debugger\src\actions\ui.js -> src\devtools\client\debugger\src\actions\sources\select.ts -> src\devtools\client\debugger\src\actions\tabs.js -> src\devtools\client\debugger\src\actions\sources\index.js -> src\devtools\client\debugger\src\actions\sources\newSources.ts -> src\devtools\client\debugger\src\actions\breakpoints\index.js -> src\devtools\client\debugger\src\actions\breakpoints\logpoints.ts
```
