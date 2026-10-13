// A configuration for sorting imports in Replay source files
// Used by https://github.com/renke/import-sort, via https://github.com/ggascoigne/prettier-plugin-import-sort
// Based on https://github.com/AndrewIngram/import-sort-style-andy as a starting point

const fs = require("fs");
const path = require("path");

// Whether the import is from a third-party package, installed in node_modules.
// import-sort's isInstalledModule resolves the import instead, which fails for
// packages that only declare "exports" (e.g. suspense) and for workspace
// packages whose entry point hasn't been built, so those got sorted with the
// app's own modules. Workspace packages are linked into node_modules too, but
// they're the app's own code, so a package only counts if it really lives there.
function isThirdPartyModule(imported) {
  const [scopeOrName, name] = imported.moduleName.split("/");
  const packageName = scopeOrName.startsWith("@") ? `${scopeOrName}/${name}` : scopeOrName;
  for (let dir = __dirname; ; dir = path.dirname(dir)) {
    const packageDir = path.join(dir, "node_modules", packageName);
    if (fs.existsSync(path.join(packageDir, "package.json"))) {
      return fs.realpathSync(packageDir).split(path.sep).includes("node_modules");
    }
    if (path.dirname(dir) === dir) {
      return false;
    }
  }
}

function sortImports(styleApi) {
  const {
    alias,
    and,
    or,
    not,
    dotSegmentCount,
    hasNoMember,
    isAbsoluteModule,
    isNodeModule,
    isRelativeModule,
    moduleName,
    unicode,
    naturally,
  } = styleApi;

  const isReactEcosystemModule = imported =>
    Boolean(imported.moduleName.match(/^(react|react-dom|prop-types|redux|\@reduxjs|next)/));

  const isNewPrototypeModule = imported =>
    Boolean(imported.moduleName.match(/^(replay-next|shared)/));
  const isProtocolModule = imported => Boolean(imported.moduleName.match(/^protocol/));
  const isOtherInternalPackageModule = imported =>
    Boolean(imported.moduleName.match(/^(accordion|design|third-party)/));

  const isGlobalReduxStoreConfig = imported =>
    Boolean(imported.moduleName.match(/^(ui\/state|ui\/setup\/hooks)/));

  const isMainSrcFolder = imported => Boolean(imported.moduleName.match(/^(devtools|ui)/));
  const isOtherSrcFolder = imported =>
    Boolean(imported.moduleName.match(/^(graphql|image|test|src)/));

  const isStylesModule = imported => Boolean(imported.moduleName.match(/\.(s?css|less)$/));
  const isImageModule = imported =>
    Boolean(imported.moduleName.match(/\.(svg|png|gif|jpg|jpeg|webp)$/));

  return [
    // Start with side-effectful imports
    // import "foo"
    { match: and(hasNoMember, isAbsoluteModule, not(isStylesModule)) },

    // import "./foo"
    {
      match: and(hasNoMember, isRelativeModule, not(isStylesModule), not(isImageModule)),
    },

    // Built-ins
    // import … from "fs";
    {
      match: and(isNodeModule, not(isStylesModule)),
      sort: moduleName(naturally),
      sortNamedMembers: alias(unicode),
    },

    // Third-party libs

    {
      // Any of these libraries, sorted alphabetically
      match: or(
        // import React from "react";
        and(isReactEcosystemModule, not(isStylesModule)),
        // import uniq from 'lodash/uniq'
        and(isThirdPartyModule, not(isRelativeModule), not(isStylesModule))
      ),
      sort: moduleName(naturally),
      sortNamedMembers: alias(unicode),
    },
    { separator: true },

    // App-wide globals
    {
      // Any of these absolute imports, sorted alphabetically
      match: and(
        or(
          // import { useAppDispatch } from "ui/setup/hooks"
          // import type { UIState } from "ui/state";
          isGlobalReduxStoreConfig,
          // import { ThreadFront } from "protocol/thread"
          isProtocolModule,
          // import { Context as PointsContext } from "replay-next/src/contexts/points/PointsContext";
          isNewPrototypeModule,
          // import { Icon } from "design/Icon"
          isOtherInternalPackageModule,
          // import Popover from "devtools/client/debugger/src/components/shared/Popover"
          isMainSrcFolder,
          isOtherSrcFolder
        ),
        not(isStylesModule)
      ),
      sort: moduleName(naturally),
      sortNamedMembers: alias(unicode),
    },
    { separator: true },

    // Relative imports

    // import … from "./foo";
    // import … from "../foo";
    {
      match: and(isRelativeModule, not(isStylesModule), not(isImageModule)),
      sort: [dotSegmentCount, moduleName(naturally)],
      sortNamedMembers: alias(unicode),
    },

    // Assets

    // import "some/global.css";
    // Left in the order they're written in, which is the order their rules
    // apply in, like the relative ones below.
    { match: and(hasNoMember, isStylesModule, not(isRelativeModule)) },

    // import styles from "bvaughn/something/Component.css"
    {
      match: and(isStylesModule, not(isRelativeModule)),
      sort: moduleName(naturally),
    },

    // import "./styles.css";
    { match: and(hasNoMember, isRelativeModule, isStylesModule) },

    // import styles from "./Components.scss";
    {
      match: isStylesModule,
      sort: [dotSegmentCount, moduleName(naturally)],
      sortNamedMembers: alias(unicode),
    },

    // import foo from "./foo.jpg";
    {
      match: isImageModule,
      sort: [dotSegmentCount, moduleName(naturally)],
      sortNamedMembers: alias(unicode),
    },
    { separator: true },
  ];
}

module.exports = sortImports;
