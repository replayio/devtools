// A configuration for sorting imports in Replay source files
// Used by https://github.com/renke/import-sort, via https://github.com/ggascoigne/prettier-plugin-import-sort
// Based on https://github.com/AndrewIngram/import-sort-style-andy as a starting point

function sortImports(styleApi) {
  const {
    alias,
    and,
    or,
    not,
    dotSegmentCount,
    hasNoMember,
    isAbsoluteModule,
    isInstalledModule,
    isNodeModule,
    isRelativeModule,
    moduleName,
    unicode,
    naturally,
  } = styleApi;

  const isReactEcosystemModule = imported =>
    Boolean(imported.moduleName.match(/^(react|react-dom|prop-types|redux|\@reduxjs|next)/));

  const isNewPrototypeModule = imported => Boolean(imported.moduleName.match(/^(bvaughn|shared)/));
  const isProtocolModule = imported => Boolean(imported.moduleName.match(/^protocol/));
  const isOtherInternalPackageModule = imported =>
    Boolean(imported.moduleName.match(/^(accordion|design|third-party)/));

  const isGlobalReduxStoreConfig = imported =>
    Boolean(imported.moduleName.match(/^(ui\/state|ui\/setup\/hooks)/));

  const isMainSrcFolder = imported => Boolean(imported.moduleName.match(/^(devtools|ui)/));
  const isOtherSrcFolder = imported => Boolean(imported.moduleName.match(/^(graphql|image|test)/));

  const isStylesModule = imported => Boolean(imported.moduleName.match(/\.(s?css|less)$/));
  const isImageModule = imported =>
    Boolean(imported.moduleName.match(/\.(svg|png|gif|jpg|jpeg|webp)$/));

  return [
    // Start with side-effectful imports
    // import "foo"
    { match: and(hasNoMember, isAbsoluteModule) },

    // import "./foo"
    {
      match: and(hasNoMember, isRelativeModule, not(isStylesModule), not(isImageModule)),
    },

    // Built-ins
    // import … from "fs";
    {
      match: isNodeModule,
      sort: moduleName(naturally),
      sortNamedMembers: alias(unicode),
    },

    // Third-party libs

    {
      // Any of these libraries, sorted alphabetically
      match: or(
        // import React from "react";
        isReactEcosystemModule,
        // import uniq from 'lodash/uniq'
        and(isInstalledModule(__filename), not(isRelativeModule))
      ),
      sort: moduleName(naturally),
      sortNamedMembers: alias(unicode),
    },
    { separator: true },

    // App-wide globals
    {
      // Any of these absolute imports, sorted alphabetically
      match: or(
        // import { useAppDispatch } from "ui/setup/hooks"
        // import type { UIState } from "ui/state";
        isGlobalReduxStoreConfig,
        // import { ThreadFront } from "protocol/thread"
        isProtocolModule,
        // import { PointsContext } from "bvaughn-architecture-demo/src/contexts/PointsContext";
        isNewPrototypeModule,
        // import { Icon } from "design/Icon"
        isOtherInternalPackageModule,
        // import Popover from "devtools/client/debugger/src/components/shared/Popover"
        isMainSrcFolder,
        isOtherSrcFolder
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

    // Local assets

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
