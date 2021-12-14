/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React, { FC } from "react";

import { Declaration } from "devtools/client/inspector/rules/components/Declaration";
import { DeclarationState } from "../state/rules";

type DeclarationsProps = {
  declarations: DeclarationState[];
  // isUserAgentStyle: boolean;
  // onToggleDeclaration: (ruleIdd: Rule['id'], declarationId: DeclarationState['id']) => void;
  // showDeclarationNameEditor: Function
  // showDeclarationValueEditor: Function
  query: string;
};

export const Declarations: FC<DeclarationsProps> = ({ declarations, query }) => {
  if (declarations.length === 0) {
    return null;
  }

  return (
    <ul className="ruleview-propertylist">
      {declarations
        .filter(declaration => !declaration.isInvisible)
        .map(declaration => (
          <Declaration key={declaration.id} declaration={declaration} query={query} />
        ))}
    </ul>
  );
};
