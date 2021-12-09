/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React, { FC } from "react";

import { Declaration } from "devtools/client/inspector/rules/components/Declaration";
import { Declaration as DeclarationType } from "devtools/client/inspector/rules/types";

type DeclarationsProps = {
  declarations: DeclarationType[];
  // isUserAgentStyle: boolean;
  // onToggleDeclaration: (ruleIdd: Rule['id'], declarationId: DeclarationType['id']) => void;
  // showDeclarationNameEditor: Function
  // showDeclarationValueEditor: Function
};

export const Declarations: FC<DeclarationsProps> = ({ declarations }) => {
  if (declarations.length === 0) {
    return null;
  }

  return (
    <ul className="ruleview-propertylist">
      {declarations
        .filter(declaration => !declaration.isInvisible)
        .map(declaration => (
          <Declaration key={declaration.id} declaration={declaration} />
        ))}
    </ul>
  );
};
