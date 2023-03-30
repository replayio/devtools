import React, { ComponentType, useEffect } from "react";

import { useNag } from "replay-next/src/hooks/useNag";
import { Nag } from "shared/graphql/types";

const NagDismiss = <P extends {}>(WrappedComponent: ComponentType<P>, nagType: Nag) => {
  return (props: P) => {
    const [, dismissNag] = useNag(nagType);

    useEffect(() => {
      dismissNag();
    }, [dismissNag]);

    return <WrappedComponent {...props} />;
  };
};

export default NagDismiss;
