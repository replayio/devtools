import React, { ComponentType, useEffect } from "react";

import { PropsFromRedux } from "devtools/client/debugger/src/components/PrimaryPanes/SourcesTree";
import { useNag } from "replay-next/src/hooks/useNag";
import { Nag } from "shared/graphql/types";

const NagDismiss = <P extends PropsFromRedux>(WrappedComponent: ComponentType<P>, nagType: Nag) => {
  return (props: P) => {
    const [, dismissNag] = useNag(nagType);

    useEffect(() => {
      dismissNag();
    }, [dismissNag]);

    return <WrappedComponent {...props} />;
  };
};

export default NagDismiss;
