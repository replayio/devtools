import React, { ComponentType, useEffect } from "react";

import { useNag } from "replay-next/src/hooks/useNag";
import { Nag } from "shared/graphql/types";

// Add type annotations for WrappedComponent and nagType
const NagDismiss = (WrappedComponent: ComponentType, nagType: Nag) => {
  return (props: any) => {
    const [, dismissNag] = useNag(nagType);

    useEffect(() => {
      dismissNag();
    }, [dismissNag]);

    // Add type annotation for props
    return <WrappedComponent {...props} />;
  };
};

export default NagDismiss;
